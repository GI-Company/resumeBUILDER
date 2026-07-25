/**
 * CSRF Origin Validation Middleware
 * 
 * Validates that mutating requests (POST, PUT, PATCH, DELETE) originate from
 * allowed origins by checking the Origin or Referer header against a whitelist.
 * 
 * This prevents cross-site request forgery where a malicious page tricks an
 * authenticated user's browser into making API calls to our backend.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns the set of allowed origins for this deployment.
 * Includes the configured APP_URL, Vercel preview URLs, and localhost for development.
 */
function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  // Configured canonical URL
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      // Invalid URL format — skip
    }
  }

  // Vercel deployment URLs (auto-set by Vercel)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    origins.add(`https://${vercelUrl}`);
  }

  // Vercel branch/preview URLs
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  if (vercelBranchUrl) {
    origins.add(`https://${vercelBranchUrl}`);
  }

  // Development
  origins.add('http://localhost:3000');
  origins.add('http://localhost:3001');
  origins.add('http://127.0.0.1:3000');

  return origins;
}

/**
 * Validates the request origin for CSRF protection.
 * 
 * @returns null if the origin is valid, or a 403 NextResponse if the origin is blocked.
 */
export function validateCsrfOrigin(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  
  // Only validate mutating methods — GET/HEAD/OPTIONS are safe
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Extract the origin from whichever header is present
  let requestOrigin: string | null = null;

  if (origin) {
    requestOrigin = origin;
  } else if (referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      // Malformed referer
    }
  }

  // If neither Origin nor Referer is present, the request likely came from
  // a non-browser client (curl, server-to-server, mobile app, etc.).
  // We allow these because they can't carry cookies for CSRF anyway.
  // The real attack vector is browser-based form posts or JS fetch from malicious pages.
  if (!requestOrigin) {
    return null;
  }

  const allowed = getAllowedOrigins();
  if (allowed.has(requestOrigin)) {
    return null;
  }

  // Also allow any *.vercel.app origin for preview deployments
  if (requestOrigin.endsWith('.vercel.app')) {
    return null;
  }

  console.warn(`[CSRF] Blocked request from origin: ${requestOrigin}`);
  return NextResponse.json(
    { error: 'Forbidden: Invalid request origin.' },
    { status: 403 }
  );
}
