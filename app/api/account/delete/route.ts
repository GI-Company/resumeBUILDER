import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrigin } from '@/lib/csrf';
import { createClient } from "@supabase/supabase-js";
import { getPostHogClient } from '@/lib/posthog-server';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrfOrigin(req);
    if (csrfError) return csrfError;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Create anon client to verify token and get user ID
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized or invalid session" }, { status: 401 });
    }

    // Create admin client using service role key to perform deletion
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error("[Account Delete Error]:", deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    const phClient = getPostHogClient();
    if (phClient) {
      phClient.capture({
        distinctId: user.id,
        event: 'account_deleted',
      });
      await phClient.flush();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Account Delete Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
