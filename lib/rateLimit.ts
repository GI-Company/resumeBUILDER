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
      // Fail closed to prevent free-tier abuse during DB outages
      return {
        allowed: false,
        count: GUEST_DAILY_LIMIT,
        remaining: 0,
        resetTime: new Date(Date.now() + 60 * 1000), // Check again in 1 min
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
      allowed: false,
      count: GUEST_DAILY_LIMIT,
      remaining: 0,
      resetTime: new Date(Date.now() + 60 * 1000),
      isAuthenticated: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Authenticated user rate limiting via Supabase RPC (user ID-based)
// NOTE: Requires the check_user_ai_limit RPC to exist in your Supabase DB.
// If the RPC fails or doesn't exist, this fails closed (blocks the request)
// to prevent free-tier abuse during outages.
// ---------------------------------------------------------------------------
export async function checkUserRateLimit(userId: string): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_user_ai_limit', { p_user_id: userId });
    if (error) {
      // DB error — fail closed for auth users
      console.warn('check_user_ai_limit RPC failed, failing closed for auth user:', error.message);
      return {
        allowed: false,
        count: USER_DAILY_LIMIT,
        remaining: 0,
        resetTime: new Date(Date.now() + 60 * 1000), // Check again in 1 min
        isAuthenticated: true,
      };
    }
    if (!data) {
      return {
        allowed: false,
        count: USER_DAILY_LIMIT,
        remaining: 0,
        resetTime: new Date(Date.now() + 60 * 1000),
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
      allowed: false,
      count: USER_DAILY_LIMIT,
      remaining: 0,
      resetTime: new Date(Date.now() + 60 * 1000),
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
            error: `Daily AI limit reached. Authenticated users get ${USER_DAILY_LIMIT} AI requests per day. Resets at ${result.resetTime.toUTCString()}.`,
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
          error: `AI Rate limit exceeded. Guest tier allows ${GUEST_DAILY_LIMIT} requests per 24 hours. Log in or sign up to unlock ${USER_DAILY_LIMIT} daily AI requests. Resets at ${result.resetTime.toUTCString()}.`,
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
