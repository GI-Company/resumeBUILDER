import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  // Read ALL env vars inside the function to ensure they are available at runtime
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 });
  }
  if (!stripeSecretKey) {
    console.error('Missing STRIPE_SECRET_KEY');
    return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars');
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No stripe-signature header' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2026-07-29.dahlia' as any,
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Signature failed: ${err.message}` }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('checkout.session.completed', { mode: session.mode, userId: session.client_reference_id });

        if (session.mode === 'subscription' && session.client_reference_id) {
          const userId = session.client_reference_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          // Count existing paid users to determine tier
          const { count: paidCount, error: countError } = await supabase
            .from('entitlements')
            .select('user_id', { count: 'exact', head: true })
            .in('tier', ['premium_founder', 'premium']);

          if (countError) {
            console.error('Failed to count paid users:', countError);
          }

          const newTier = (paidCount ?? 0) < 50 ? 'premium_founder' : 'premium';
          console.log(`Upgrading user ${userId} to ${newTier} (paid count: ${paidCount})`);

          const { error: upsertError } = await supabase
            .from('entitlements')
            .upsert({
              user_id: userId,
              tier: newTier,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
            }, { onConflict: 'user_id' });

          if (upsertError) {
            console.error('Failed to upsert entitlement:', JSON.stringify(upsertError));
            return NextResponse.json({ error: `DB upsert failed: ${upsertError.message}` }, { status: 500 });
          }

          console.log(`Successfully upgraded user ${userId} to ${newTier}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription || invoice.parent?.subscription_details?.subscription;
        if (subscriptionId) {
          const { error } = await supabase
            .from('entitlements')
            .update({ subscription_status: 'active' })
            .eq('stripe_subscription_id', subscriptionId);
          if (error) console.error('Failed to update subscription status:', error);
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: currentEnt } = await supabase
          .from('entitlements')
          .select('tier')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const newTier = isActive
          ? (currentEnt?.tier === 'premium_founder' ? 'premium_founder' : 'premium')
          : 'free';

        const { error } = await supabase
          .from('entitlements')
          .update({
            subscription_status: subscription.status,
            tier: newTier,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) console.error('Failed to update subscription:', error);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: `Processing error: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
