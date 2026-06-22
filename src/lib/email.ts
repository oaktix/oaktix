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
