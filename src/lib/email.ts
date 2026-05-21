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
