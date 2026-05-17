import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || "oaktix-otp-secret-fallback";

function verifySignature(email: string, otp: string, signature: string): boolean {
  // Check current and previous 10-min window to handle edge cases
  const now = Math.floor(Date.now() / 600000);
  for (const bucket of [now, now - 1]) {
    const expected = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${email}:${otp}:${bucket}`)
      .digest("hex");
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return true;
    }
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const { email, otp, signature, userId } = await req.json();

    if (!email || !otp || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the HMAC signature
    if (!verifySignature(email, otp, signature)) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Confirm the user's email via Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (userId) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

      if (confirmError) {
        console.error("Confirm user error:", confirmError);
        return NextResponse.json({ error: "Failed to confirm email" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
