import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
    }
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    // Verify user token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine price dynamically based on paid founders count (server-side, tamper-proof)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { count: paidCount } = await supabaseAdmin
      .from('entitlements')
      .select('user_id', { count: 'exact', head: true })
      .in('tier', ['premium_founder', 'premium']);

    const priceId = (paidCount ?? 0) < 50
      ? 'price_1Tz9Tc3z1hyiOMOwwrdfM6mi'  // $3.99 Premium Founder (Live)
      : 'price_1Tz9vb3z1hyiOMOwDF6P5mxJ'; // $9.99 Premium Standard (Live)

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-07-29.dahlia' as any,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agentrez.space';

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?canceled=true`,
      client_reference_id: user.id,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
