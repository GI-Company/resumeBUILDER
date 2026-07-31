// ============================================================
//  app/api/stats/route.ts — Public Stats Endpoint
//  Returns the current founding member count (total auth users).
//  Uses the service role key to count auth.users safely server-side.
//  No authentication required — this is public data.
// ============================================================
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let total = 0;
    let paidFoundingCount = 0;

    // 1. Primary: Use service role key to count auth.users directly
    if (serviceKey) {
      try {
        const adminClient = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (!error && data) {
          total = (data as any)?.total ?? data?.users?.length ?? 0;
        }

        // Fetch paid founding count
        const { count: paidCount } = await adminClient
          .from('entitlements')
          .select('id', { count: 'exact', head: true })
          .in('tier', ['premium_founder', 'premium']);
        
        paidFoundingCount = paidCount ?? 0;

      } catch (e) {
        console.warn('[stats] Admin client query failed:', e);
      }
    }

    // 2. Secondary fallback: Query profiles or resumes tables
    if (total === 0) {
      try {
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
        const client = createClient(supabaseUrl, anonKey);
        const { count: pCount } = await client.from('profiles').select('id', { count: 'exact', head: true });
        const { count: rCount } = await client.from('resumes').select('id', { count: 'exact', head: true });
        total = Math.max(pCount ?? 0, rCount ?? 0);
      } catch (e) {
        console.warn('[stats] Anon client fallback failed:', e);
      }
    }

    // Baseline fallback: Ensure active signups are reflected
    const displayCount = Math.max(1, total);

    return NextResponse.json(
      { count: displayCount, freeFoundingCount: displayCount, paidFoundingCount },
      { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );

  } catch (err) {
    console.error('[stats] Error fetching user count:', err);
    return NextResponse.json(
      { count: 1, freeFoundingCount: 1, paidFoundingCount: 0 },
      { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  }
}
