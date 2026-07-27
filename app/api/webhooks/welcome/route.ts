// ============================================================
//  app/api/webhooks/welcome/route.ts — New User Welcome Email
//
//  Triggered by a Supabase Database Webhook on auth.users INSERT.
//  Two layers of protection:
//    1. validateCsrfOrigin — guards against browser-based forgery
//       (server-to-server calls from Supabase pass through since they
//       carry no Origin header, which is the expected/safe case)
//    2. SUPABASE_WEBHOOK_SECRET bearer token — primary protection;
//       validates the request actually originated from Supabase.
//
//  If RESEND_API_KEY is not set, the webhook still accepts the
//  trigger and logs the new user for manual follow-up — no hard crash.
// ============================================================
import { NextResponse } from 'next/server';
import { validateCsrfOrigin } from '@/lib/csrf';

export async function POST(req: Request) {
  // 1. CSRF origin check (browser-based forgery protection).
  //    Server-to-server Supabase calls have no Origin header and pass
  //    through per the validateCsrfOrigin spec — that is correct behaviour.
  const { NextRequest } = await import('next/server');
  const csrfError = validateCsrfOrigin(req as unknown as InstanceType<typeof NextRequest>);
  if (csrfError) return csrfError;

  try {
    // 2. Webhook secret validation — primary protection for this endpoint.
    //    Must match the Authorization header Supabase sends with the webhook.
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('❌ SUPABASE_WEBHOOK_SECRET is not set. Welcome webhook is disabled for security.');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Parse and validate the Supabase webhook payload
    const body = await req.json();

    if (body.type !== 'INSERT' || !body.record || !body.record.email) {
      return NextResponse.json({ error: 'Invalid payload or missing email' }, { status: 400 });
    }

    const userEmail = body.record.email;
    const signedUpAt = body.record.created_at ?? new Date().toISOString();

    // 4. Send welcome email via Resend — gracefully skips if not configured.
    //    If RESEND_API_KEY is absent, the signup is logged so you can follow
    //    up manually. This prevents the webhook from erroring on Supabase's
    //    side and retrying in a loop.
    if (!process.env.RESEND_API_KEY) {
      console.log(`[welcome-webhook] ℹ️  RESEND_API_KEY not configured.`);
      console.log(`[welcome-webhook] 📬 New signup pending manual welcome email:`);
      console.log(`[welcome-webhook]    Email: ${userEmail}`);
      console.log(`[welcome-webhook]    At:    ${signedUpAt}`);
      return NextResponse.json({
        success: true,
        note: 'Email skipped — RESEND_API_KEY not set. User logged for manual follow-up.',
        user: userEmail,
        signedUpAt,
      });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const templateId = process.env.RESEND_WELCOME_TEMPLATE_ID;

    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: process.env.RESEND_FROM_EMAIL || 'Agent Rez AI <onboarding@resend.dev>',
      to: userEmail,
      subject: "Welcome to Agent Rez AI! Let's build your resume.",
      ...(templateId
        ? { react: undefined } // placeholder; set template below
        : {
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #6366f1;">Welcome to Agent Rez AI! 🎉</h2>
          <p>We are thrilled to have you as one of our early founding members.</p>
          <p>Agent Rez AI was built to take the pain out of resume formatting so you can focus on what actually matters: your content. Whether you're targeting a senior leadership role or looking to pivot into a new industry, our ATS-optimized templates and real-time AI tools are here to give you an unfair advantage.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #475569;">Quick Start Guide:</h3>
            <ol style="margin-bottom: 0;">
              <li style="margin-bottom: 8px;"><strong>Choose a Template:</strong> Head to the editor and pick one of our 6 premium layouts.</li>
              <li style="margin-bottom: 8px;"><strong>Paste your JD:</strong> Drop the Job Description into the AI tools panel to see your real-time ATS match score.</li>
              <li><strong>Export to PDF:</strong> One click, and you're ready to apply!</li>
            </ol>
          </div>

          <p>If you hit any snags or have feature requests, just reply directly to this email. I read every single one.</p>
          <br/>
          <p>Happy building,</p>
          <p><strong>The Agent Rez Team</strong></p>
        </div>
      `,
          }),
    };

    // If using a Resend template, swap in the template ID
    if (templateId) {
      (payload as any).template = { id: templateId };
      delete (payload as any).html;
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error('[welcome-webhook] Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[welcome-webhook] ✅ Welcome email sent to ${userEmail}`);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('[welcome-webhook] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
