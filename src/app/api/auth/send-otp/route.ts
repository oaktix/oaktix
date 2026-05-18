import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY!);
const OTP_SECRET = process.env.OTP_SECRET || "oaktix-otp-secret-fallback";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signOtp(email: string, otp: string): string {
  const bucket = Math.floor(Date.now() / 600000); // 10-min windows
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${email}:${otp}:${bucket}`)
    .digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const otp = generateOtp();
    const signature = signOtp(email, otp);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your OakTix account</title>
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
              <h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Verify your email address</h1>
              <p style="font-size:14px;color:#64786B;line-height:1.6;margin:0 0 28px;">
                Welcome to OakTix! Enter the code below to confirm your email address and activate your account. This code expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Code Block -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background:#F0F7F4;border:2px dashed #5fa589;border-radius:16px;padding:28px 24px;text-align:center;">
                      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#64786B;letter-spacing:2px;text-transform:uppercase;">Your verification code</p>
                      <div style="font-size:44px;font-weight:800;letter-spacing:12px;color:#0E4B31;font-family:'Courier New',monospace;padding-left:12px;">${otp}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#889C8F;line-height:1.6;margin:24px 0 0;text-align:center;">
                Enter this code on the OakTix verification page.<br/>
                Did not request this? You can safely ignore this email.
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

    let emailError = null;
    try {
      const { error } = await resend.emails.send({
        from: "OakTix <hello@oaktix.com.ng>",
        to: email,
        subject: `${otp} is your OakTix verification code`,
        html: htmlContent,
      });
      emailError = error;

      if (emailError) {
        console.warn("Primary custom domain dispatch failed inside send-otp, retrying with sandbox onboarding@resend.dev...");
        const { error: fallbackError } = await resend.emails.send({
          from: "OakTix <onboarding@resend.dev>",
          to: email,
          subject: `[Sandbox] ${otp} is your OakTix verification code`,
          html: htmlContent,
        });
        emailError = fallbackError;
      }
    } catch (err) {
      console.error("send-otp primary send crashed, attempting sandbox fallback:", err);
      try {
        const { error: fallbackError } = await resend.emails.send({
          from: "OakTix <onboarding@resend.dev>",
          to: email,
          subject: `[Sandbox] ${otp} is your OakTix verification code`,
          html: htmlContent,
        });
        emailError = fallbackError;
      } catch (fallbackErr) {
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : "Unknown sandbox fallback error";
        console.error("Sandbox fallback inside send-otp failed:", fallbackMsg);
        emailError = fallbackErr;
      }
    }

    if (emailError) {
      console.error("Resend send-otp delivery failed after fallback:", emailError);
      return NextResponse.json({ error: "Failed to send email after fallback attempts" }, { status: 500 });
    }

    // Return signature so client can verify later (stateless - no DB needed)
    return NextResponse.json({ signature });
  } catch (err: unknown) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
