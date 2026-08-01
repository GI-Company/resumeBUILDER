import { supabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';

export async function checkAndLogPdfLimit(request: NextRequest, checkOnly: boolean = false) {
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    (request as unknown as { ip?: string }).ip ||
    '127.0.0.1';

  let userObj: any = null;
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      userObj = user;
    }
  }

  if (userObj) {
    // 1. Check user tier
    const { data: entitlement } = await supabase
      .from('entitlements')
      .select('tier')
      .eq('user_id', userObj.id)
      .single();
      
    const tier = entitlement?.tier || 'free';
    
    // 2. Enforce limits based on tier
    if (tier === 'premium' || tier === 'premium_founder') {
      if (!checkOnly) await supabase.rpc('log_user_pdf_export', { p_user_id: userObj.id });
      return { allowed: true, tier };
    } else {
      const { data: allowed, error } = await supabase.rpc('check_user_pdf_export_limit', { p_user_id: userObj.id, p_limit: 3 });
      if (error || !allowed) {
        return { allowed: false, error: 'Monthly export limit reached (3/3). Please upgrade to Premium for unlimited PDF exports.', code: 'RATE_LIMIT_EXCEEDED' };
      }
      if (!checkOnly) await supabase.rpc('log_user_pdf_export', { p_user_id: userObj.id });
      return { allowed: true, tier };
    }
  }

  // Guest check (1 per IP per month)
  const { data: allowed, error } = await supabase.rpc('check_guest_pdf_export_limit', { p_ip: ip, p_limit: 1 });
  
  if (error || !allowed) {
    return { allowed: false, error: 'Monthly guest export limit reached (1/1). Log in or sign up to unlock more exports.', code: 'RATE_LIMIT_EXCEEDED' };
  }

  if (!checkOnly) await supabase.rpc('log_guest_pdf_export', { p_ip: ip });
  return { allowed: true, tier: 'guest' };
}
