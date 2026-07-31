import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Determine price dynamically based on paid founders count to prevent client tampering
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { count: paidCount } = await supabaseAdmin
      .from('entitlements')
      .select('id', { count: 'exact', head: true })
      .in('tier', ['premium_founder', 'premium']);
      
    const priceId = (paidCount ?? 0) < 50 
      ? 'price_1Tz8RY3z1hyiOMOwVWD4fJiM'  // $3.99 Premium Founder
      : 'price_1Tz9es3z1hyiOMOw3lqzcqX0'; // $9.99 Premium Standard

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      customer_email: session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      client_reference_id: session.user.id,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
