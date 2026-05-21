import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Initialize Resend client – reuse the same API key used for outbound emails
const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Resend inbound webhook handler.
 * Resend will POST a payload when an inbound email is received.
 * If the email is addressed to hello@oaktix.com.ng we forward the same
 * content to the dedicated Resend mailbox (hello@esteiwiloa.resend.app)
 * so it appears in the email portal.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Resend payload shape may vary; the relevant fields are typically inside
    // `payload` directly (e.g., { from, to, subject, html, text })
    const {
      from,
      to,
      subject = '',
      html,
      text,
    } = payload as Record<string, any>;

    // Guard: only act on the specific inbound address
    if (typeof to === 'string' && to.includes('hello@oaktix.com.ng')) {
      await resend.emails.send({
        from: from ?? process.env.FROM_EMAIL!, // fall back to a configured FROM address
        to: 'hello@esteiwiloa.resend.app',
        subject,
        // Prefer HTML; if not present, fall back to plain text content
        html: html ?? text ?? '',
      });
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Resend inbound webhook handling failed:', error);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}
