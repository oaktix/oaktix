import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Forward emails sent to hello@oaktix.com.ng to hello@esteiwiloa.resend.app as well
const recipients = to === "hello@oaktix.com.ng" ? [to, "hello@esteiwiloa.resend.app"] : to;
await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: recipients,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    // swallow error to avoid breaking main flow
  }
}

export async function sendWithdrawalRequestedEmail(to: string, amount: number) {
  const subject = 'Withdrawal Request Received';
  const html = `<p>Dear Vendor,</p>
<p>We have received your withdrawal request of <strong>₦${amount.toLocaleString()}</strong>. Our team will process it within 24 hours.</p>
<p>Thank you for using Oaktix.</p>`;
  await sendEmail(to, subject, html);
}

export async function sendWithdrawalStatusEmail(to: string, amount: number, status: 'approved' | 'rejected') {
  const capitalized = status.charAt(0).toUpperCase() + status.slice(1);
  const subject = `Your Withdrawal Has Been ${capitalized}`;
  const html = `<p>Dear Vendor,</p>
<p>Your withdrawal request of <strong>₦${amount.toLocaleString()}</strong> has been <strong>${status}</strong> by the Oaktix admin team.</p>
<p>Thank you for using Oaktix.</p>`;
  await sendEmail(to, subject, html);
}
