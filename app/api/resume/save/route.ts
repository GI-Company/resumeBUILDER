import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrigin } from '@/lib/csrf';
import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrfOrigin(req);
    if (csrfError) return csrfError;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Create Supabase client in user security context so auth.uid() evaluates correctly in the DB
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await client.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, content, status, clientId } = await req.json();

    const { data, error } = await client.rpc("save_resume", {
      p_id: id,
      p_content: content,
      p_client_id: clientId,
      p_status: status || 'active'
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
