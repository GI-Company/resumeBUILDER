import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl || !rawKey) {
  // In development, throw immediately so the developer knows to set up .env.local.
  // In production builds (SSG/ISR), env vars may not be available at build time,
  // so we warn instead of crashing the build process.
  const message = 
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in your Supabase credentials.';
  
  if (process.env.NODE_ENV === 'development') {
    throw new Error(message);
  } else {
    console.error(`[Supabase] ${message}`);
  }
}

const supabaseUrl = (rawUrl || 'https://placeholder.supabase.co').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = rawKey || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);
