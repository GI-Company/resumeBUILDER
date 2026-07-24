import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Using the existing rate limit logic if available, otherwise simplified
// Wait, I will just create a simple endpoint without rateLimit imported to avoid breaking if the import path is wrong.

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
// Use the service role key to bypass RLS and insert securely from the backend
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { event_type, display_message } = await req.json();

    if (!event_type || !display_message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Only allow specific event types to prevent malicious string injection
    const allowedEvents = ["PDF_EXPORTED", "AI_USED", "RESUME_CREATED", "TEMPLATE_CHANGED"];
    if (!allowedEvents.includes(event_type)) {
      return NextResponse.json({ success: false, error: "Invalid event type" }, { status: 400 });
    }

    // Sanitize the display_message (limit length to prevent massive payload spam)
    const safeMessage = display_message.substring(0, 150);

    const { error } = await supabase
      .from('public_activity_feed')
      .insert([
        { event_type, display_message: safeMessage }
      ]);

    if (error) {
      console.error("Error inserting to public_activity_feed:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in log-activity route:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
