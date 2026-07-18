// ============================================================
//  lib/rateLimit.ts — Tiered Rate Limiting
//  Guests:     5 AI requests per 24 hours (Supabase RPC)
//  Auth users: 100 AI requests per 24 hours (Supabase RPC)
// ============================================================
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { RateLimitResult } from '@/lib/types';

const GUEST_DAILY_LIMIT = 5;
const USER_DAILY_LIMIT = 100;

// ---------------------------------------------------------------------------
// Guest rate limiting via Supabase RPC (IP-based)
// ---------------------------------------------------------------------------
export async function checkGuestRateLimit(ip: string): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_guest_ai_limit', { p_ip: ip });
    if (error || !data) {
      console.error('Supabase guest rate limit RPC failed:', error);
      // Fail open gracefully — log the error but don't block the user
      return {
        allowed: true,
        count: 1,
        remaining: GUEST_DAILY_LIMIT - 1,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isAuthenticated: false,
      };
    }
    return {
      allowed: data.allowed,
      count: data.count,
      remaining: data.remaining,
      resetTime: new Date(data.resetTime),
      isAuthenticated: false,
    };
  } catch (err) {
    console.error('Rate limit exception:', err);
    return {
      allowed: true,
      count: 1,
      remaining: GUEST_DAILY_LIMIT - 1,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isAuthenticated: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Authenticated user rate limiting via Supabase RPC (user ID-based)
// NOTE: Requires the check_user_ai_limit RPC to exist in your Supabase DB.
// If the RPC doesn't exist yet, this fails open (allows the request) so
// logged-in users are never blocked due to a missing migration.
// ---------------------------------------------------------------------------
export async function checkUserRateLimit(userId: string): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_user_ai_limit', { p_user_id: userId });
    if (error) {
      // RPC doesn't exist yet (PGRST202) or other DB error — fail open for auth users
      console.warn('check_user_ai_limit RPC not available, failing open for auth user:', error.message);
      return {
        allowed: true,
        count: 0,
        remaining: USER_DAILY_LIMIT,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isAuthenticated: true,
      };
    }
    if (!data) {
      return {
        allowed: true,
        count: 0,
        remaining: USER_DAILY_LIMIT,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isAuthenticated: true,
      };
    }
    return {
      allowed: data.allowed,
      count: data.count,
      remaining: data.remaining,
      resetTime: new Date(data.resetTime),
      isAuthenticated: true,
    };
  } catch (err) {
    console.error('User rate limit exception:', err);
    return {
      allowed: true,
      count: 0,
      remaining: USER_DAILY_LIMIT,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isAuthenticated: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Main enforcement middleware used by all AI routes
// ---------------------------------------------------------------------------
export async function enforceRateLimit(
  req: NextRequest
): Promise<{ errorResponse: NextResponse | null; user: User | null; ip: string; rateLimitResult: RateLimitResult | null }> {
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    (req as unknown as { ip?: string }).ip ||
    '127.0.0.1';

  // Extract JWT for auth check
  let userObj: User | null = null;
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userObj = user;
      }
    } catch (err) {
      console.warn('Optional auth verification failed:', err);
    }
  }

  // Authenticated users: generous limit (100/day)
  if (userObj) {
    const result = await checkUserRateLimit(userObj.id);
    if (!result.allowed) {
      return {
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Daily AI limit reached. Authenticated users get ${USER_DAILY_LIMIT} AI requests per day. Your limit resets at ${result.resetTime.toLocaleTimeString()}.`,
            remaining: 0,
            resetTime: result.resetTime.toISOString(),
          },
          { status: 429 }
        ),
        user: userObj,
        ip,
        rateLimitResult: result,
      };
    }
    return { errorResponse: null, user: userObj, ip, rateLimitResult: result };
  }

  // Guests: strict limit (5/day)
  const result = await checkGuestRateLimit(ip);
  if (!result.allowed) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `AI Rate limit exceeded. Guest tier allows ${GUEST_DAILY_LIMIT} requests per 24 hours. Log in or sign up to unlock ${USER_DAILY_LIMIT} daily AI requests. Your limit resets at ${result.resetTime.toLocaleTimeString()}.`,
          remaining: 0,
          resetTime: result.resetTime.toISOString(),
        },
        { status: 429 }
      ),
      user: null,
      ip,
      rateLimitResult: result,
    };
  }

  return { errorResponse: null, user: null, ip, rateLimitResult: result };
}
