import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';

// Rate limiting is handled securely via Supabase RPC to work correctly on serverless platforms
export async function checkAndIncrementRateLimit(ip: string): Promise<{ allowed: boolean; count: number; remaining: number; resetTime: Date }> {
  try {
    const { data, error } = await supabase.rpc('check_guest_ai_limit', { p_ip: ip });
    if (error || !data) {
      console.error('Supabase rate limit RPC failed:', error);
      // Fail open gracefully if DB is down, but log the error
      return { allowed: true, count: 1, remaining: 4, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) };
    }
    return {
      allowed: data.allowed,
      count: data.count,
      remaining: data.remaining,
      resetTime: new Date(data.resetTime)
    };
  } catch (err) {
    console.error('Rate limit exception:', err);
    return { allowed: true, count: 1, remaining: 4, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  }
}

export async function enforceRateLimit(req: NextRequest): Promise<{ errorResponse: NextResponse | null; user: User | null; ip: string }> {
    // 1. Get client IP address for robust rate limiting
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || (req as any).ip || '127.0.0.1';
    
    // 2. Extract JWT auth: Logged-in users get unlimited requests
    let userObj = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          userObj = user;
        }
      } catch (err) {
        console.warn('Optional auth verification failed:', err);
      }
    }

    // 3. Enforce 5 AI requests every 24 hours ONLY for guests
    if (!userObj) {
      const rateLimit = await checkAndIncrementRateLimit(ip);
      
      if (!rateLimit.allowed) {
        return {
          errorResponse: NextResponse.json(
            { 
              success: false, 
              error: `AI Rate limit exceeded. Guest tier is limited to 5 requests per 24 hours. Please Log In or Sign Up to unlock more high-speed AI requests. Your limit resets at ${rateLimit.resetTime.toLocaleTimeString()}.` 
            },
            { status: 429 }
          ),
          user: null,
          ip
        };
      }
    }
    
    return { errorResponse: null, user: userObj, ip };
}
