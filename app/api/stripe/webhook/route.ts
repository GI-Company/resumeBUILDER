import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service_role key to bypass RLS

export async function POST(req: Request) {
  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Stripe webhook or Supabase service environment variables.');
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('No signature provided', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.client_reference_id) {
          const userId = session.client_reference_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          const { count: paidCount } = await supabase
            .from('entitlements')
            .select('id', { count: 'exact', head: true })
            .in('tier', ['premium_founder', 'premium']);
          const newTier = (paidCount ?? 0) < 50 ? 'premium_founder' : 'premium';

          const { error } = await supabase
            .from('entitlements')
            .update({
              tier: newTier,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
            })
            .eq('user_id', userId);

          if (error) {
            console.error('Failed to update entitlement:', error);
            return new NextResponse('Database Error', { status: 500 });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.parent?.subscription_details?.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.parent.subscription_details.subscription as string);
          
          const { error } = await supabase
            .from('entitlements')
            .update({
              subscription_status: 'active',
              current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

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
          .single();
          
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const newTier = isActive ? (currentEnt?.tier === 'premium_founder' ? 'premium_founder' : 'premium') : 'free';

        const { error } = await supabase
          .from('entitlements')
          .update({
            subscription_status: subscription.status,
            tier: newTier,
            current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) console.error('Failed to update subscription status:', error);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook processing error', { status: 500 });
  }

  return new NextResponse('Webhook received', { status: 200 });
}
