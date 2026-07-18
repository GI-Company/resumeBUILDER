// ============================================================
//  app/api/stats/route.ts — Public Stats Endpoint
//  Returns the current founding member count (total auth users).
//  Uses the service role key to count auth.users safely server-side.
//  No authentication required — this is public data.
// ============================================================
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If no service key, fall back to counting resumes as a proxy
    // (each user who saves has at least 1 resume)
    if (!serviceKey) {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const client = createClient(supabaseUrl, anonKey);
      // Count distinct user_ids in resumes as a lower-bound user proxy
      const { count, error } = await client
        .from('resumes')
        .select('user_id', { count: 'exact', head: true });
      
      if (error) {
        return NextResponse.json({ count: 0 }, { status: 200 });
      }
      return NextResponse.json({ count: count ?? 0 }, { status: 200 });
    }

    // With service role key, count auth.users directly
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1 });
    
    if (error) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    // Total count from pagination metadata
    const total = (data as any)?.total ?? 0;
    return NextResponse.json({ count: total }, { status: 200 });

  } catch (err) {
    console.error('[stats] Error fetching user count:', err);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
