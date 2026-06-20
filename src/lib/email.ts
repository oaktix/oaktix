import { Resend } from 'resend';

// Initialise Resend client – same API key used throughout the project
const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Send an email via Resend.
 * Returns `true` when the email was accepted by Resend, otherwise `false`.
 * Any unexpected error will be logged and the caller can decide how to handle it.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    // Forward any @oaktix.com.ng email to the corresponding @esteiwiloa.resend.app address
    const recipients = to.endsWith('@oaktix.com.ng')
      ? [to, `${to.split('@')[0]}@esteiwiloa.resend.app`]
      : to;

    const fromEmail = process.env.FROM_EMAIL || 'hello@oaktix.com.ng';

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html,
    });

    console.log('✅ Resend email sent', result);
    // Resend returns an object with `id` on success – treat truthy `id` as success
    return Boolean((result as any)?.id);
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    return false;
  }
}

/** ------------------------------------------------------------------ */
/** Withdrawal‑related email helpers – they now propagate failures */
/** ------------------------------------------------------------------ */
/** ------------------------------------------------------------------ */
/** Professional inquiry notification                                   */
/** ------------------------------------------------------------------ */
export async function sendProfessionalInquiryEmail(opts: {
  to: string;
  professionalName: string;
  clientName: string;
  clientEmail: string;
  eventType?: string;
  eventDate?: string;
  message: string;
  dashboardUrl: string;
}) {
  const { to, professionalName, clientName, clientEmail, eventType, eventDate, message, dashboardUrl } = opts;

  const subject = `New inquiry from ${clientName} — OakTix`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Inquiry – OakTix</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,0.05);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0E4B31 0%,#1a6b47 100%);padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.12);border-radius:12px;padding:10px 14px;">
                    <span style="font-size:24px;">🎟️</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top:10px;">
                <span style="font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                  <span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span>
                </span>
              </div>
              <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:4px 0 0;letter-spacing:0.5px;">Nigeria's #1 Event Ticketing Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">You have a new inquiry!</h1>
              <p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 28px;">
                Hi <strong>${professionalName}</strong>, someone is interested in booking you for an event.
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7F4;border-radius:14px;padding:24px;margin-bottom:24px;">
                <tr><td style="padding-bottom:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">From</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1A1A1A;">${clientName}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#64786B;">${clientEmail}</p>
                </td></tr>
                ${eventType ? `<tr><td style="padding-bottom:12px;border-top:1px solid #DCE3DF;padding-top:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Event Type</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;">${eventType}</p>
                </td></tr>` : ""}
                ${eventDate ? `<tr><td style="padding-bottom:12px;border-top:1px solid #DCE3DF;padding-top:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Event Date</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;">${new Date(eventDate).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </td></tr>` : ""}
                <tr><td style="border-top:1px solid #DCE3DF;padding-top:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Message</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;line-height:1.6;">${message}</p>
                </td></tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                      View Inquiry →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#889C8F;line-height:1.6;margin:24px 0 0;text-align:center;">
                Reply promptly to improve your booking rate.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#E8EBE7;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="font-size:12px;color:#BAC6BF;margin:0 0 4px;">
                Sent by <strong style="color:#64786B;">OakTix</strong> · Nigeria's Favourite Ticketing Platform
              </p>
              <p style="font-size:11px;color:#DCE3DF;margin:0;">hello@oaktix.com.ng</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error("⚠ Inquiry notification email failed:", error);
    // Non-blocking — do not interrupt the inquiry submission
  }
}

/** ------------------------------------------------------------------ */
/** Withdrawal‑related email helpers – they now propagate failures */
/** ------------------------------------------------------------------ */
export async function sendWithdrawalRequestedEmail(
  to: string,
  amount: number,
) {
  const finalRecipient = to === 'hello@oaktix.com.ng' ? 'theoaktix@gmail.com' : to;
  const subject = 'Withdrawal Request Received';
  const html = `<p>Dear Vendor,</p>
<p>We have received your withdrawal request of <strong>₦${amount.toLocaleString()}</strong>. Our team will process it within 24 hours.</p>
<p>Thank you for using Oaktix.</p>`;
  try {
    await sendEmail(finalRecipient, subject, html);
  } catch (error) {
    console.error('⚠ Withdrawal request email failed:', error);
    // Continue without interrupting withdrawal flow
  }
}

export async function sendWithdrawalStatusEmail(
  to: string,
  amount: number,
  status: 'approved' | 'rejected',
) {
  const finalRecipient = to === 'hello@oaktix.com.ng' ? 'theoaktix@gmail.com' : to;
  const capitalized = status.charAt(0).toUpperCase() + status.slice(1);
  const subject = `Your Withdrawal Has Been ${capitalized}`;
  const html = `<p>Dear Vendor,</p>
<p>Your withdrawal request of <strong>₦${amount.toLocaleString()}</strong> has been <strong>${status}</strong> by the Oaktix admin team.</p>
<p>Thank you for using Oaktix.</p>`;
  try {
    await sendEmail(finalRecipient, subject, html);
  } catch (error) {
    console.error('⚠ Withdrawal status email failed:', error);
    // Continue without interrupting withdrawal flow
  }
}
