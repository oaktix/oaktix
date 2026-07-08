import { Resend } from 'resend';

// Initialise Resend client – same API key used throughout the project
const resend = new Resend(process.env.RESEND_API_KEY!);

export interface EmailAttachment {
  filename: string;
  content: string;   // base64-encoded file content
  content_type: string;
  content_id?: string; // set this to embed inline via CID (for images in body)
}

/**
 * Send an email via Resend.
 * Returns `true` when the email was accepted by Resend, otherwise `false`.
 * Any unexpected error will be logged and the caller can decide how to handle it.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[],
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
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, 'base64'),
        content_type: a.content_type,
        ...(a.content_id ? { content_id: a.content_id } : {}),
      })),
    });

    const { data, error: resendError } = result as any;
    if (resendError) {
      console.error('❌ Resend API error:', resendError);
      return false;
    }
    console.log('✅ Resend email sent', data);
    // Resend v6 returns { data: { id }, error } — success when data.id is truthy
    return Boolean(data?.id);
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
/** Professional registration – admin alert                             */
/** ------------------------------------------------------------------ */
export async function sendProfessionalRegistrationAdminEmail(opts: {
  professionalName: string;
  category: string;
  city: string | null;
  state: string | null;
  applicantEmail: string;
  adminUrl: string;
}) {
  const { professionalName, category, city, state, applicantEmail, adminUrl } = opts;

  const subject = `New professional profile awaiting approval — ${professionalName}`;
  const location = [city, state].filter(Boolean).join(', ') || 'Not specified';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Professional Registration – OakTix</title>
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
              <h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">New Professional Registration</h1>
              <p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 28px;">
                A new professional has submitted their profile for review.
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7F4;border-radius:14px;padding:24px;margin-bottom:24px;">
                <tr><td style="padding-bottom:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Professional Name</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1A1A1A;">${professionalName}</p>
                </td></tr>
                <tr><td style="padding-bottom:12px;border-top:1px solid #DCE3DF;padding-top:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Category</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;">${category}</p>
                </td></tr>
                <tr><td style="padding-bottom:12px;border-top:1px solid #DCE3DF;padding-top:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Location</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;">${location}</p>
                </td></tr>
                <tr><td style="border-top:1px solid #DCE3DF;padding-top:12px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Applicant Email</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;">${applicantEmail}</p>
                </td></tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                      Review Profile →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#889C8F;line-height:1.6;margin:24px 0 0;text-align:center;">
                This is an automated alert from OakTix.
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
    await sendEmail('theoaktix@gmail.com', subject, html);
  } catch (error) {
    console.error('⚠ Professional registration admin email failed:', error);
    // Non-blocking — do not interrupt the registration flow
  }
}

/** ------------------------------------------------------------------ */
/** Professional registration – applicant confirmation                  */
/** ------------------------------------------------------------------ */
export async function sendProfessionalRegistrationConfirmationEmail(opts: {
  to: string;
  professionalName: string;
}) {
  const { to, professionalName } = opts;

  const subject = `Your OakTix professional profile is under review`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received – OakTix</title>
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
              <h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Application Received!</h1>
              <p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 28px;">
                Hi <strong>${professionalName}</strong>, thank you for applying to join the OakTix Professionals directory. Your profile is currently under review by our team.
              </p>

              <!-- What happens next callout -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7F4;border-radius:14px;border:2px dashed #B7D4C4;padding:24px;margin-bottom:24px;">
                <tr><td>
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0E4B31;">⏳ What happens next?</p>
                  <p style="margin:0;font-size:14px;color:#64786B;line-height:1.6;">Our team typically reviews applications within 24–48 hours. You'll receive another email as soon as your profile is approved.</p>
                </td></tr>
              </table>

              <p style="font-size:13px;color:#889C8F;line-height:1.6;margin:0;text-align:center;">
                Questions? Reply to this email or contact <a href="mailto:hello@oaktix.com.ng" style="color:#0E4B31;text-decoration:none;font-weight:600;">hello@oaktix.com.ng</a>
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
    console.error('⚠ Professional registration confirmation email failed:', error);
    // Non-blocking — do not interrupt the registration flow
  }
}

/** ------------------------------------------------------------------ */
/** Professional registration – approval notification                   */
/** ------------------------------------------------------------------ */
export async function sendProfessionalApprovalEmail(opts: {
  to: string;
  professionalName: string;
  profileUrl: string;
}) {
  const { to, professionalName, profileUrl } = opts;

  const subject = `Congratulations — your OakTix profile is live! 🎉`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're Approved – OakTix</title>
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
              <h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">You're approved!</h1>
              <p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 28px;">
                Hi <strong>${professionalName}</strong>, great news! Your professional profile has been reviewed and approved. You're now listed in the OakTix directory and clients can find and contact you.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <a href="${profileUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                      View Your Profile →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#889C8F;line-height:1.6;margin:0;text-align:center;">
                Share your profile link with clients to start getting bookings.
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
    console.error('⚠ Professional approval email failed:', error);
    // Non-blocking — do not interrupt the approval flow
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
  const subject = 'Withdrawal Request Received — OakTix';
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,.05);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0E4B31,#1a6b47);padding:32px 40px;text-align:center;">
<div style="margin-bottom:8px;font-size:28px;font-weight:800;"><span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span></div>
<p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
<h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 16px;">Withdrawal Request Received</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 24px;">We have received your withdrawal request of <strong style="color:#1A1A1A;">₦${amount.toLocaleString()}</strong>. Our team will process it within 24 hours.</p>
<div style="background:#F0F7F4;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0;font-size:13px;color:#0E4B31;font-weight:700;">⏳ What happens next?</p>
<p style="margin:8px 0 0;font-size:13px;color:#64786B;line-height:1.6;">Once processed, funds will be transferred to your linked bank account. You'll receive another email when your withdrawal is approved.</p>
</div>
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #E8EBE7;">
<p style="font-size:11px;color:#DCE3DF;margin:0;">Sent by <strong style="color:#64786B;">OakTix</strong> · hello@oaktix.com.ng</p>
</td></tr>
</table></td></tr></table></body></html>`;
  try {
    await sendEmail(finalRecipient, subject, html);
  } catch (error) {
    console.error('⚠ Withdrawal request email failed:', error);
  }
}

export async function sendWithdrawalRequestedAdminNotification(
  vendorEmail: string,
  vendorName: string,
  amount: number,
  bankDetails: { payout_bank?: string; payout_account_number?: string; payout_account_name?: string }
) {
  const adminEmail = 'thryveeonline@gmail.com';
  const subject = `New Withdrawal Request Alert — ₦${amount.toLocaleString()}`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,.05);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0E4B31,#1a6b47);padding:32px 40px;text-align:center;">
<div style="margin-bottom:8px;font-size:28px;font-weight:800;"><span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span></div>
<p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">New Withdrawal Request Alert</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
<h1 style="font-size:20px;font-weight:700;color:#1A1A1A;margin:0 0 16px;">New Withdrawal Request</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 20px;">
  An organizer has requested a withdrawal. Here are the details:
</p>
<div style="background:#F0F7F4;border-radius:14px;padding:20px;margin-bottom:20px;font-size:14px;">
  <p style="margin:4px 0;"><strong>Vendor Name:</strong> ${vendorName}</p>
  <p style="margin:4px 0;"><strong>Vendor Email:</strong> ${vendorEmail}</p>
  <p style="margin:4px 0;"><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
</div>
<div style="background:#F7F8F7;border-radius:14px;padding:20px;font-size:14px;">
  <p style="margin:0 0 8px;font-weight:700;color:#1A1A1A;">Bank/Payout Details:</p>
  <p style="margin:4px 0;"><strong>Bank:</strong> ${bankDetails.payout_bank || 'N/A'}</p>
  <p style="margin:4px 0;"><strong>Account Number:</strong> ${bankDetails.payout_account_number || 'N/A'}</p>
  <p style="margin:4px 0;"><strong>Account Name:</strong> ${bankDetails.payout_account_name || 'N/A'}</p>
</div>
</td></tr>
</table></td></tr></table></body></html>`;

  try {
    await sendEmail(adminEmail, subject, html);
  } catch (error) {
    console.error('⚠ Admin withdrawal alert failed:', error);
  }
}

export async function sendWithdrawalStatusEmail(
  to: string,
  amount: number,
  status: 'approved' | 'rejected',
) {
  const finalRecipient = to === 'hello@oaktix.com.ng' ? 'theoaktix@gmail.com' : to;
  const isApproved = status === 'approved';
  const subject = `Your Withdrawal Has Been ${isApproved ? 'Approved' : 'Rejected'} — OakTix`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,.05);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0E4B31,#1a6b47);padding:32px 40px;text-align:center;">
<div style="margin-bottom:8px;font-size:28px;font-weight:800;"><span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span></div>
<p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
<h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 16px;">Withdrawal ${isApproved ? 'Approved ✅' : 'Rejected'}</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 24px;">Your withdrawal request of <strong style="color:#1A1A1A;">₦${amount.toLocaleString()}</strong> has been <strong style="color:${isApproved ? '#16a34a' : '#dc2626'};">${status}</strong> by the OakTix admin team.</p>
${isApproved
  ? `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0;font-size:13px;color:#15803D;font-weight:700;">💰 Funds on the way</p>
<p style="margin:8px 0 0;font-size:13px;color:#16a34a;line-height:1.6;">Your funds should appear in your linked bank account within 1–2 business days.</p>
</div>`
  : `<div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0;font-size:13px;color:#BE123C;font-weight:700;">❌ Request Not Approved</p>
<p style="margin:8px 0 0;font-size:13px;color:#BE123C;line-height:1.6;">Please contact support at hello@oaktix.com.ng for assistance or to resubmit your request.</p>
</div>`}
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #E8EBE7;">
<p style="font-size:11px;color:#DCE3DF;margin:0;">Sent by <strong style="color:#64786B;">OakTix</strong> · hello@oaktix.com.ng</p>
</td></tr>
</table></td></tr></table></body></html>`;
  try {
    await sendEmail(finalRecipient, subject, html);
  } catch (error) {
    console.error('⚠ Withdrawal status email failed:', error);
  }
}

/** ------------------------------------------------------------------ */
/** Admin email campaign — sends a branded message to a single recipient */
/** ------------------------------------------------------------------ */
export async function sendCampaignEmail(opts: {
  to: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  trackingPixelUrl?: string;
  attachments?: EmailAttachment[];
}) {
  const { to, recipientName, subject, bodyHtml, trackingPixelUrl, attachments } = opts;
  const replySubject = encodeURIComponent(`Re: ${subject}`);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oaktix.com.ng';
  const logoUrl = `${siteUrl}/logo-header.png`;

  // Inline images: CID-based embeds that appear in the body section
  const inlineImages = attachments?.filter((a) => !!a.content_id) ?? [];
  const inlineImagesHtml = inlineImages.length > 0
    ? `<div style="margin:20px 0 0;">${inlineImages.map((img) =>
        `<img src="cid:${img.content_id}" alt="${img.filename}"
              style="max-width:100%;border-radius:10px;display:block;margin-bottom:12px;" />`
      ).join('')}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">

<!-- Header — real OakTix logo -->
<tr><td style="background:linear-gradient(135deg,#0E4B31 0%,#1a6b47 100%);padding:28px 40px 24px;text-align:center;">
<a href="${siteUrl}" style="display:inline-block;">
  <img src="${logoUrl}" alt="OakTix"
       style="height:40px;width:auto;display:block;margin:0 auto;"
       onerror="this.style.display='none';document.getElementById('oaktix-logo-text').style.display='block';" />
  <span id="oaktix-logo-text" style="display:none;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
    <span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span>
  </span>
</a>
<p style="color:rgba(255,255,255,0.70);font-size:12px;margin:10px 0 0;letter-spacing:0.5px;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>

<!-- Subject banner -->
<tr><td style="background:#F7F9F8;border-bottom:1px solid #E8EBE7;padding:16px 40px;">
<p style="margin:0;font-size:11px;font-weight:700;color:#889C8F;text-transform:uppercase;letter-spacing:1.5px;">Message from OakTix</p>
<h1 style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1A1A1A;">${subject}</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:36px 40px 28px;">
<p style="font-size:14px;color:#64786B;margin:0 0 20px;">Hi <strong style="color:#1A1A1A;">${recipientName}</strong>,</p>
<div style="font-size:14px;color:#333;line-height:1.75;margin:0 0 4px;">${bodyHtml}</div>
${inlineImagesHtml}

<!-- Reply CTA -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
<tr><td align="center">
<a href="mailto:theoaktix@gmail.com?subject=${replySubject}"
   style="display:inline-block;padding:13px 30px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
  💬 Reply to OakTix
</a>
</td></tr>
</table>
<p style="font-size:12px;color:#AAB8B2;text-align:center;margin:20px 0 0;">Click the button above to send us a message.</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><div style="height:1px;background:#E8EBE7;"></div></td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;text-align:center;">
<img src="${logoUrl}" alt="OakTix" style="height:24px;width:auto;display:block;margin:0 auto 10px;"
     onerror="this.style.display='none';" />
<p style="font-size:12px;color:#BAC6BF;margin:0 0 4px;">Sent by <strong style="color:#64786B;">OakTix</strong> · Nigeria's Favourite Ticketing Platform</p>
<p style="font-size:11px;color:#DCE3DF;margin:0;">hello@oaktix.com.ng</p>
</td></tr>

</table>
</td></tr>
</table>
${trackingPixelUrl ? `<!-- Open tracking pixel --><img src="${trackingPixelUrl}" width="1" height="1" style="display:none;border:0;outline:0;" alt="" />` : ''}
</body>
</html>`;

  return sendEmail(to, subject, html, attachments);
}

/** ------------------------------------------------------------------ */
/** KYC submission — admin notification                                  */
/** ------------------------------------------------------------------ */
export async function sendKYCSubmittedAdminEmail(opts: {
  organizerName: string;
  organizerEmail: string;
  documentType: string;
  adminUrl: string;
}) {
  const { organizerName, organizerEmail, documentType, adminUrl } = opts;
  const subject = `KYC Document Submitted — ${organizerName}`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,.05);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0E4B31,#1a6b47);padding:32px 40px;text-align:center;">
<div style="margin-bottom:8px;font-size:28px;font-weight:800;"><span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span></div>
<p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
<h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">New KYC Submission</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 28px;">An organizer has submitted their identity verification document for review.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7F4;border-radius:14px;padding:24px;margin-bottom:24px;">
<tr><td style="padding-bottom:12px;">
<p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Organizer</p>
<p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1A1A1A;">${organizerName}</p>
<p style="margin:2px 0 0;font-size:13px;color:#64786B;">${organizerEmail}</p>
</td></tr>
<tr><td style="border-top:1px solid #DCE3DF;padding-top:12px;">
<p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Document Type</p>
<p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;">${documentType}</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${adminUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">Review KYC →</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #E8EBE7;">
<p style="font-size:11px;color:#DCE3DF;margin:0;">Sent by <strong style="color:#64786B;">OakTix</strong> · hello@oaktix.com.ng</p>
</td></tr>
</table></td></tr></table></body></html>`;
  try {
    await sendEmail('theoaktix@gmail.com', subject, html);
  } catch (error) {
    console.error('⚠ KYC admin notification email failed:', error);
  }
}

/** ------------------------------------------------------------------ */
/** KYC approved — organizer notification                                */
/** ------------------------------------------------------------------ */
export async function sendKYCApprovedEmail(opts: {
  to: string;
  organizerName: string;
  dashboardUrl: string;
}) {
  const { to, organizerName, dashboardUrl } = opts;
  const subject = `Your Identity Verification Has Been Approved — OakTix`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,.05);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0E4B31,#1a6b47);padding:32px 40px;text-align:center;">
<div style="margin-bottom:8px;font-size:28px;font-weight:800;"><span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span></div>
<p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
<h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Identity Verified ✅</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 24px;">Hi <strong>${organizerName}</strong>, your identity verification has been reviewed and approved. You can now request withdrawals from your OakTix account.</p>
<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0;font-size:13px;color:#15803D;font-weight:700;">🎉 You're all set!</p>
<p style="margin:8px 0 0;font-size:13px;color:#16a34a;line-height:1.6;">Head to your finances dashboard to request your first withdrawal.</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">Go to Finances →</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #E8EBE7;">
<p style="font-size:11px;color:#DCE3DF;margin:0;">Sent by <strong style="color:#64786B;">OakTix</strong> · hello@oaktix.com.ng</p>
</td></tr>
</table></td></tr></table></body></html>`;
  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('⚠ KYC approval email failed:', error);
  }
}

/** ------------------------------------------------------------------ */
/** KYC submitted — organizer submission confirmation                    */
/** ------------------------------------------------------------------ */
export async function sendKYCPendingOrganizerEmail(opts: {
  to: string;
  organizerName: string;
  documentType: string;
  dashboardUrl: string;
}) {
  const { to, organizerName, documentType, dashboardUrl } = opts;
  const subject = `Your KYC Document Has Been Received — OakTix`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,.05);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0E4B31,#1a6b47);padding:32px 40px;text-align:center;">
<div style="margin-bottom:8px;font-size:28px;font-weight:800;"><span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span></div>
<p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
<h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Document Received ✅</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 24px;">Hi <strong>${organizerName}</strong>, we have received your identity verification document and it is now under review by our team.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7F4;border-radius:14px;padding:24px;margin-bottom:24px;">
<tr><td style="padding-bottom:12px;">
<p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Document Submitted</p>
<p style="margin:4px 0 0;font-size:14px;color:#1A1A1A;">${documentType}</p>
</td></tr>
<tr><td style="border-top:1px solid #DCE3DF;padding-top:12px;">
<p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Status</p>
<p style="margin:4px 0 0;font-size:14px;color:#D97706;font-weight:700;">⏳ Pending Review</p>
</td></tr>
</table>
<div style="background:#FFF9EB;border:1px solid #FDE68A;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0;font-size:13px;color:#92400E;font-weight:700;">⏳ What happens next?</p>
<p style="margin:8px 0 0;font-size:13px;color:#78350F;line-height:1.6;">Our team typically reviews documents within 24–48 hours. You will receive an email once your verification is approved or if we need you to resubmit.</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">View Dashboard →</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #E8EBE7;">
<p style="font-size:11px;color:#DCE3DF;margin:0;">Sent by <strong style="color:#64786B;">OakTix</strong> · hello@oaktix.com.ng</p>
</td></tr>
</table></td></tr></table></body></html>`;
  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('⚠ KYC pending organizer email failed:', error);
  }
}

/** ------------------------------------------------------------------ */
/** KYC rejected — organizer rejection notification with reupload guide  */
/** ------------------------------------------------------------------ */
export async function sendKYCRejectedEmail(opts: {
  to: string;
  organizerName: string;
  rejectionReason?: string;
  dashboardUrl: string;
}) {
  const { to, organizerName, rejectionReason, dashboardUrl } = opts;
  const subject = `Action Required: Your KYC Verification Was Not Accepted — OakTix`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,.05);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0E4B31,#1a6b47);padding:32px 40px;text-align:center;">
<div style="margin-bottom:8px;font-size:28px;font-weight:800;"><span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span></div>
<p style="color:rgba(255,255,255,.75);font-size:13px;margin:0;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
<h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Verification Not Accepted ❌</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 24px;">Hi <strong>${organizerName}</strong>, unfortunately your identity verification document was not accepted. Please review the reason below and resubmit.</p>
${rejectionReason ? `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
<tr><td>
<p style="margin:0;font-size:11px;font-weight:700;color:#BE123C;letter-spacing:1.5px;text-transform:uppercase;">Reason for Rejection</p>
<p style="margin:8px 0 0;font-size:14px;color:#1A1A1A;line-height:1.6;">${rejectionReason}</p>
</td></tr>
</table>` : ''}
<div style="background:#F0F7F4;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
<p style="margin:0;font-size:13px;color:#0E4B31;font-weight:700;">🔄 How to fix this</p>
<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:#64786B;line-height:1.8;">
<li>Make sure your document is valid, not expired, and clearly readable.</li>
<li>Upload a high-quality image — blurry or cut-off documents will be rejected.</li>
<li>If your document was rejected, try using a different document type (e.g. Voter's Card, Passport, or Driver's Licence).</li>
</ul>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">Resubmit Verification →</a>
</td></tr>
</table>
<p style="font-size:12px;color:#AAB8B2;text-align:center;margin:20px 0 0;">Need help? Reply to this email or contact <a href="mailto:hello@oaktix.com.ng" style="color:#0E4B31;text-decoration:none;font-weight:600;">hello@oaktix.com.ng</a></p>
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #E8EBE7;">
<p style="font-size:11px;color:#DCE3DF;margin:0;">Sent by <strong style="color:#64786B;">OakTix</strong> · hello@oaktix.com.ng</p>
</td></tr>
</table></td></tr></table></body></html>`;
  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('⚠ KYC rejection email failed:', error);
  }
}

/** ------------------------------------------------------------------ */
/** Abandoned checkout — reminder email to complete ticket purchase      */
/** ------------------------------------------------------------------ */
export async function sendAbandonedCheckoutEmail(opts: {
  to: string;
  recipientName: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  location: string | null;
  ticketTypeName: string;
  quantity: number;
  amount: number;
  eventImageUrl: string | null;
  windowLabel: string;         // "2 hours" | "12 hours" | "24 hours"
  siteUrl: string;
}) {
  const {
    to, recipientName, eventTitle, eventSlug, eventDate,
    location, ticketTypeName, quantity, amount, eventImageUrl,
    windowLabel, siteUrl,
  } = opts;

  const checkoutUrl = `${siteUrl}/events/${eventSlug}`;
  const formattedDate = new Date(eventDate).toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const formattedAmount = amount > 0 ? `₦${amount.toLocaleString()}` : "Free";
  const is24h = windowLabel === "24 hours";

  const subject = is24h
    ? `Last chance! Complete your ${eventTitle} ticket purchase — OakTix`
    : `You left something behind — ${eventTitle} tickets are waiting 🎟️`;

  const urgencyMsg = is24h
    ? "This is your final reminder. Don't miss your chance to secure your spot."
    : `You started buying tickets ${windowLabel} ago but didn't complete the purchase.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #E8EBE7;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0E4B31 0%,#1a6b47 100%);padding:28px 40px 24px;text-align:center;">
<div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px;">
  <span style="color:#5fa589;">Oak</span><span style="color:#F19E23;">Tix</span>
</div>
<p style="color:rgba(255,255,255,0.70);font-size:12px;margin:0;letter-spacing:0.5px;">Nigeria's #1 Event Ticketing Platform</p>
</td></tr>

${eventImageUrl ? `
<!-- Event image -->
<tr><td style="padding:0;">
<img src="${eventImageUrl}" alt="${eventTitle}" style="width:100%;height:200px;object-fit:cover;display:block;" />
</td></tr>` : ''}

<!-- Body -->
<tr><td style="padding:36px 40px 28px;">
<p style="font-size:14px;color:#64786B;margin:0 0 6px;">Hi <strong style="color:#1A1A1A;">${recipientName}</strong>,</p>
<h1 style="font-size:20px;font-weight:800;color:#1A1A1A;margin:0 0 12px;line-height:1.3;">${urgencyMsg}</h1>
<p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 24px;">Your spot at <strong style="color:#1A1A1A;">${eventTitle}</strong> is not confirmed yet. Complete your purchase before tickets sell out.</p>

<!-- Event details card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7F4;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
  <tr><td style="padding-bottom:10px;">
    <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Event</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1A1A1A;">${eventTitle}</p>
  </td></tr>
  <tr><td style="border-top:1px solid #DCE3DF;padding:10px 0;">
    <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Date</p>
    <p style="margin:4px 0 0;font-size:13px;color:#1A1A1A;">📅 ${formattedDate}</p>
  </td></tr>
  ${location ? `<tr><td style="border-top:1px solid #DCE3DF;padding:10px 0;">
    <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Location</p>
    <p style="margin:4px 0 0;font-size:13px;color:#1A1A1A;">📍 ${location}</p>
  </td></tr>` : ''}
  <tr><td style="border-top:1px solid #DCE3DF;padding:10px 0;">
    <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Your Order</p>
    <p style="margin:4px 0 0;font-size:13px;color:#1A1A1A;">${ticketTypeName} × ${quantity}</p>
  </td></tr>
  <tr><td style="border-top:1px solid #DCE3DF;padding-top:10px;">
    <p style="margin:0;font-size:11px;font-weight:700;color:#64786B;letter-spacing:1.5px;text-transform:uppercase;">Total</p>
    <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:#0E4B31;">${formattedAmount}</p>
  </td></tr>
</table>

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td align="center">
<a href="${checkoutUrl}" style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#0E4B31,#1a6b47);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
  🎟️ Complete My Purchase
</a>
</td></tr>
</table>

${is24h ? `<div style="background:#FFF9EB;border:1px solid #FDE68A;border-radius:12px;padding:14px 20px;text-align:center;margin-bottom:8px;">
<p style="margin:0;font-size:13px;color:#92400E;font-weight:700;">⏰ Final Reminder — don't miss out!</p>
<p style="margin:4px 0 0;font-size:12px;color:#78350F;">This is the last reminder we'll send. Tickets are limited.</p>
</div>` : ''}

<p style="font-size:12px;color:#AAB8B2;text-align:center;margin:16px 0 0;line-height:1.6;">
  If you no longer wish to attend, simply ignore this email.<br/>
  Questions? <a href="mailto:hello@oaktix.com.ng" style="color:#0E4B31;text-decoration:none;font-weight:600;">hello@oaktix.com.ng</a>
</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><div style="height:1px;background:#E8EBE7;"></div></td></tr>

<!-- Footer -->
<tr><td style="padding:20px 40px;text-align:center;">
<p style="font-size:11px;color:#DCE3DF;margin:0;">Sent by <strong style="color:#64786B;">OakTix</strong> · Nigeria's Favourite Ticketing Platform · hello@oaktix.com.ng</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const ok = await sendEmail(to, subject, html);
  if (!ok) {
    throw new Error(`sendEmail returned false for abandoned checkout reminder → ${to}`);
  }
}

/** ================================================================== */
/** Registration approval + waitlist emails (free events)              */
/** ================================================================== */

/**
 * Send a branded registration email. Mirrors the free-checkout route's
 * graceful fallback: try the primary domain first, then fall back to the
 * onboarding@resend.dev sandbox sender if the primary send fails.
 */
async function sendRegistrationEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: 'OakTix <hello@oaktix.com.ng>',
      to,
      subject,
      html,
    });
    if ((result as { error?: unknown }).error) {
      console.warn('Primary domain dispatch failed, retrying with sandbox onboarding@resend.dev...', (result as { error?: unknown }).error);
      await resend.emails.send({
        from: 'OakTix <onboarding@resend.dev>',
        to,
        subject: `[Sandbox] ${subject}`,
        html,
      });
    }
  } catch (err) {
    console.error('Registration email crashed, retrying with sandbox from address:', err);
    try {
      await resend.emails.send({
        from: 'OakTix <onboarding@resend.dev>',
        to,
        subject: `[Sandbox] ${subject}`,
        html,
      });
    } catch (fallbackErr) {
      console.error('Sandbox fallback dispatch failed:', fallbackErr);
    }
  }
}

/** Shared branded shell — header / body / footer matching the free route. */
function registrationShell(opts: {
  emoji: string;
  tagline: string;
  bodyHtml: string;
  title: string;
}): string {
  const { emoji, tagline, bodyHtml, title } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF9F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6; padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px; background:#ffffff; border-radius:24px; border:1px solid #E8EBE7; box-shadow:0 8px 32px rgba(0,0,0,0.04); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0E4B31 0%,#1a6b47 100%); padding:32px 40px; text-align:center;">
              <span style="font-size:28px;">${emoji}</span>
              <div style="margin-top:8px;">
                <span style="font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                  <span style="color:#5fa589;">Oak</span>Tix
                </span>
              </div>
              <p style="color:rgba(255,255,255,0.7); font-size:12px; margin:4px 0 0; text-transform:uppercase; letter-spacing:1px;">${tagline}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background:#E8EBE7;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; text-align:center;">
              <p style="font-size:12px; color:#BAC6BF; margin:0 0 4px 0;">
                OakTix · Nigeria's Favourite Event Marketplace
              </p>
              <p style="font-size:11px; color:#889C8F; margin:0;">
                Need help? Contact us at <a href="mailto:hello@oaktix.com.ng" style="color:#0E4B31; text-decoration:underline;">hello@oaktix.com.ng</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reusable event-details card for registration emails. */
function eventDetailsCard(opts: {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventBannerUrl?: string;
}): string {
  const { eventTitle, eventDate, eventLocation, eventBannerUrl } = opts;
  return `
    <div style="background:#FAF9F6; border:1px solid #E8EBE7; border-radius:16px; padding:20px; margin-bottom:32px;">
      ${eventBannerUrl ? `<img src="${eventBannerUrl}" alt="Event Banner" style="width:100%; height:160px; object-fit:cover; border-radius:8px; margin-bottom:16px;" />` : ""}
      <h3 style="margin:0 0 8px 0; font-size:18px; font-weight:700; color:#0E4B31;">${eventTitle}</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr><td style="padding:4px 0; font-size:13px; color:#64786B;"><strong>Date:</strong> ${eventDate}</td></tr>
        <tr><td style="padding:4px 0; font-size:13px; color:#64786B;"><strong>Where:</strong> ${eventLocation}</td></tr>
      </table>
    </div>`;
}

/** Registrant: request received, pending organizer approval. NO meeting link. */
export async function sendRegistrationPendingEmail(opts: {
  to: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  isVirtual?: boolean;
  eventBannerUrl?: string;
}) {
  const { to, eventTitle, eventDate, eventLocation, isVirtual, eventBannerUrl } = opts;
  const subject = `Registration received — pending approval: ${eventTitle}`;
  const venueNote = isVirtual ? "This is a virtual event." : eventLocation;
  const body = `
    <h2 style="font-size:22px; font-weight:700; color:#1A1A1A; margin:0 0 8px 0;">Your request is pending approval ⏳</h2>
    <p style="font-size:14px; color:#64786B; line-height:1.6; margin:0 0 28px 0;">
      Thanks for registering! The organizer reviews each request before letting attendees in.
      You'll receive a confirmation email${isVirtual ? " with the meeting link" : " with your ticket"} as soon as you're approved.
    </p>
    ${eventDetailsCard({ eventTitle, eventDate, eventLocation: venueNote, eventBannerUrl })}
    <div style="background:#FFF9EB; border:1px solid #FDE68A; border-radius:14px; padding:18px 22px;">
      <p style="margin:0; font-size:13px; color:#92400E; font-weight:700;">⏳ What happens next?</p>
      <p style="margin:8px 0 0; font-size:13px; color:#78350F; line-height:1.6;">The organizer will review your request shortly. No further action is needed from you for now.</p>
    </div>`;
  await sendRegistrationEmail(to, subject, registrationShell({
    emoji: "⏳", tagline: "Registration Pending", title: "Registration Pending", bodyHtml: body,
  }));
}

/** Registrant: approved. Includes meeting link for virtual, QR tickets always. */
export async function sendRegistrationApprovedEmail(opts: {
  to: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  isVirtual?: boolean;
  meetingLink?: string;
  meetingPassword?: string;
  tickets: Array<{ uniqueCode: string; qrCodeUrl: string }>;
  eventBannerUrl?: string;
}) {
  const {
    to, eventTitle, eventDate, eventLocation, isVirtual,
    meetingLink, meetingPassword, tickets, eventBannerUrl,
  } = opts;
  const subject = `You're in! Your OakTix ticket: ${eventTitle}`;

  let ticketsHtml = "";
  for (const t of tickets) {
    ticketsHtml += `
      <div style="background:#ffffff; border:1px solid #E8EBE7; border-radius:16px; padding:24px; margin-bottom:20px; box-shadow:0 4px 12px rgba(0,0,0,0.02); text-align:center;">
        <p style="margin:0 0 16px 0; font-size:16px; font-weight:700; color:#0E4B31; font-family:monospace;">${t.uniqueCode}</p>
        <div style="margin:16px auto; width:200px; height:200px; text-align:center;">
          <img src="${t.qrCodeUrl}" alt="Ticket QR Code" style="width:200px; height:200px; border-radius:8px;" />
        </div>
        <p style="margin:12px 0 0 0; font-size:12px; color:#64786B;">Scan this QR code at the entrance for verification.</p>
      </div>`;
  }

  const meetingHtml = isVirtual && meetingLink ? `
    <div style="background:#F0FDF4; border:1px solid #DCFCE7; border-radius:16px; padding:20px; margin-bottom:32px;">
      <h4 style="margin:0 0 10px 0; font-size:14px; font-weight:700; color:#15803D;">🔗 Join the event online</h4>
      <p style="margin:0 0 6px 0; font-size:13px; color:#166534; line-height:1.5;">
        <strong>Meeting Link:</strong> <a href="${meetingLink}" style="color:#0E4B31; font-weight:bold; text-decoration:underline; word-break:break-all;">${meetingLink}</a>
      </p>
      ${meetingPassword ? `<p style="margin:0; font-size:13px; color:#166534;"><strong>Passcode:</strong> <span style="font-family:monospace; background:#ffffff; border:1px solid #DCFCE7; padding:2px 8px; border-radius:6px; font-weight:bold;">${meetingPassword}</span></p>` : ""}
    </div>` : "";

  const body = `
    <h2 style="font-size:22px; font-weight:700; color:#1A1A1A; margin:0 0 8px 0;">You're approved! 🎉</h2>
    <p style="font-size:14px; color:#64786B; line-height:1.6; margin:0 0 28px 0;">
      Great news — the organizer has approved your registration. ${isVirtual ? "Your meeting access details and ticket are below." : "Your ticket is below; please present the QR code at the entrance."}
    </p>
    ${eventDetailsCard({ eventTitle, eventDate, eventLocation: isVirtual ? "Virtual event" : eventLocation, eventBannerUrl })}
    ${meetingHtml}
    <h4 style="font-size:14px; font-weight:700; color:#1A1A1A; margin:0 0 16px 0; text-transform:uppercase; letter-spacing:0.5px;">Your Ticket${tickets.length > 1 ? `s (${tickets.length})` : ""}</h4>
    ${ticketsHtml}`;

  await sendRegistrationEmail(to, subject, registrationShell({
    emoji: "🎟️", tagline: "Registration Approved", title: "You're Approved", bodyHtml: body,
  }));
}

/** Registrant: waitlisted (capacity full). NO meeting link. */
export async function sendRegistrationWaitlistEmail(opts: {
  to: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  isVirtual?: boolean;
  eventBannerUrl?: string;
}) {
  const { to, eventTitle, eventDate, eventLocation, isVirtual, eventBannerUrl } = opts;
  const subject = `You're on the waitlist: ${eventTitle}`;
  const body = `
    <h2 style="font-size:22px; font-weight:700; color:#1A1A1A; margin:0 0 8px 0;">You're on the waitlist 📋</h2>
    <p style="font-size:14px; color:#64786B; line-height:1.6; margin:0 0 28px 0;">
      This event is currently at full capacity, so we've added you to the waitlist. If a spot opens up,
      you'll be notified by email${isVirtual ? " with the meeting link" : " with your ticket"}.
    </p>
    ${eventDetailsCard({ eventTitle, eventDate, eventLocation: isVirtual ? "Virtual event" : eventLocation, eventBannerUrl })}
    <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:14px; padding:18px 22px;">
      <p style="margin:0; font-size:13px; color:#1E40AF; font-weight:700;">📋 What happens next?</p>
      <p style="margin:8px 0 0; font-size:13px; color:#1E3A8A; line-height:1.6;">We'll automatically email you if a spot becomes available. No further action is needed.</p>
    </div>`;
  await sendRegistrationEmail(to, subject, registrationShell({
    emoji: "📋", tagline: "Added to Waitlist", title: "You're on the Waitlist", bodyHtml: body,
  }));
}

/** Registrant: request declined. NO meeting link. */
export async function sendRegistrationRejectedEmail(opts: {
  to: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  isVirtual?: boolean;
  eventBannerUrl?: string;
}) {
  const { to, eventTitle, eventDate, eventLocation, isVirtual, eventBannerUrl } = opts;
  const subject = `Update on your registration: ${eventTitle}`;
  const body = `
    <h2 style="font-size:22px; font-weight:700; color:#1A1A1A; margin:0 0 8px 0;">Registration not approved</h2>
    <p style="font-size:14px; color:#64786B; line-height:1.6; margin:0 0 28px 0;">
      Thank you for your interest. Unfortunately, the organizer was unable to approve your registration for this event.
    </p>
    ${eventDetailsCard({ eventTitle, eventDate, eventLocation: isVirtual ? "Virtual event" : eventLocation, eventBannerUrl })}
    <p style="font-size:13px; color:#889C8F; line-height:1.6; margin:0; text-align:center;">
      If you believe this was a mistake, please reach out to the organizer or contact us at <a href="mailto:hello@oaktix.com.ng" style="color:#0E4B31; text-decoration:underline;">hello@oaktix.com.ng</a>.
    </p>`;
  await sendRegistrationEmail(to, subject, registrationShell({
    emoji: "📨", tagline: "Registration Update", title: "Registration Update", bodyHtml: body,
  }));
}

/** Organizer: a new registration awaits approval. */
export async function sendOrganizerPendingRequestEmail(opts: {
  to: string;
  organizerName?: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  ticketTypeName: string;
  quantity: number;
}) {
  const { to, organizerName, eventTitle, buyerName, buyerEmail, ticketTypeName, quantity } = opts;
  const subject = `[OakTix] New registration awaiting your approval: ${eventTitle}`;
  const body = `
    <h2 style="font-size:22px; font-weight:700; color:#1A1A1A; margin:0 0 8px 0;">New registration to review ⏳</h2>
    <p style="font-size:14px; color:#64786B; line-height:1.6; margin:0 0 28px 0;">
      Hi ${organizerName || "Organizer"}, a new registration for <strong>${eventTitle}</strong> is awaiting your approval.
    </p>
    <div style="background:#FAF9F6; border:1px solid #E8EBE7; border-radius:16px; padding:20px; margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Name:</strong> ${buyerName}</td></tr>
        <tr><td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Email:</strong> ${buyerEmail}</td></tr>
        <tr><td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Ticket Type:</strong> ${ticketTypeName}</td></tr>
        <tr><td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Quantity:</strong> ${quantity}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="https://oaktix.com.ng/organizer/attendees" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#0E4B31,#1a6b47); color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; border-radius:12px;">Review Registration →</a>
      </td></tr>
    </table>`;
  await sendRegistrationEmail(to, subject, registrationShell({
    emoji: "🔔", tagline: "Approval Needed", title: "New Registration", bodyHtml: body,
  }));
}
