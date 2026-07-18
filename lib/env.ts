// ============================================================
//  lib/env.ts — Environment Variable Validation
//  Validates all required env vars lazily (on first access),
//  so builds succeed even without env vars present.
//  At runtime, the server will throw a clear error if any
//  required key is missing.
// ============================================================
import { z } from 'zod';

const envSchema = z.object({
  GROQ: z.string().min(10, 'GROQ API key is missing or too short'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'),
});

type Env = z.infer<typeof envSchema>;

// Lazily validated — only throws when first accessed at request time, not build time.
let _validated: Env | null = null;

function getEnv(): Env {
  if (_validated) return _validated;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `❌ Missing or invalid environment variables:\n${issues}\n\nCheck your .env.local or Vercel environment settings.`
    );
  }

  _validated = parsed.data;
  return _validated;
}

// Proxy that validates env on first property access (runtime only)
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
