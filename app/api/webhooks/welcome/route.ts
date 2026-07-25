import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize the Resend client with the environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // 1. Verify Webhook Secret to ensure the request is actually from Supabase
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.warn('⚠️ Missing SUPABASE_WEBHOOK_SECRET in environment variables.');
      // We don't fail hard here in dev, but you really should set this in prod.
    } else if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the Supabase Webhook payload
    const body = await req.json();

    // Ensure it's an INSERT event and we have an email
    if (body.type !== 'INSERT' || !body.record || !body.record.email) {
      return NextResponse.json({ error: 'Invalid payload or missing email' }, { status: 400 });
    }

    const userEmail = body.record.email;

    // 3. Send the Welcome Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Agent Rez AI <welcome@agentrez.com>', // Replace with your verified sender domain if applicable
      to: userEmail,
      subject: 'Welcome to Agent Rez AI! Let\'s build your resume.',
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
    });

    if (error) {
      console.error('Error sending welcome email via Resend:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
