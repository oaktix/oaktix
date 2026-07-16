import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, fullName, phone } = await req.json();

    if (!email || !fullName || !phone) {
      return NextResponse.json({ error: "Email, Full Name and Phone Number are required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let user = null;

    // Check if profile already exists in DB
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      user = { id: existingProfile.id, email: existingProfile.email };
    } else {
      // It's a new guest! Return a pending status so the Transactpay payment webhook
      // securely handles account creation, secure temporary password generation, and auto-email delivery.
      user = { id: "guest_pending", email: email.toLowerCase() };
    }

    return NextResponse.json({ user });
  } catch (err: unknown) {
    console.error("Guest checkout API error:", err);
    return NextResponse.json({ error: (err as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
