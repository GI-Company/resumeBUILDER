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

    // Verify the user token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up their Stripe customer ID using the service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: entData, error: entError } = await supabaseAdmin
      .from('entitlements')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (entError) {
      console.error('Entitlements lookup error:', entError);
      return NextResponse.json({ error: `DB error: ${entError.message}` }, { status: 500 });
    }

    if (!entData?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active Stripe customer found for this account.' }, { status: 404 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-07-29.dahlia' as any,
    });

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://agentrez.space'}/dashboard`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: entData.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
