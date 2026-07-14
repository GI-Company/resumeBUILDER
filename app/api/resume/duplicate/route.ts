import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ success: false }, { status: 401 });
    const { data: { user } } = await supabaseServer.auth.getUser(authHeader.split(" ")[1]);
    if (!user) return NextResponse.json({ success: false }, { status: 401 });

    const { id } = await req.json();
    const { data, error } = await supabaseServer.rpc("duplicate_resume", { p_id: id });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
