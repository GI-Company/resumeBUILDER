import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await client.auth.getUser(token);

    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Determine stripe customer id securely
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: entData } = await supabaseAdmin
      .from('entitlements')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!entData?.stripe_customer_id) {
      return new NextResponse('No active Stripe customer found', { status: 404 });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/dashboard`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: entData.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
