import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // Password recovery always lands on the reset-password form regardless of
  // what "next" was set to.  This avoids problems where the redirectTo URL
  // with query-params doesn't exactly match the Supabase allow-list entry.
  const destination = type === "recovery" ? "/reset-password" : next;

  const supabase = await createClient();

  // PKCE flow — magic link / OAuth / email confirmation / password recovery
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Token-hash flow — password recovery links (non-PKCE / token_hash format)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid or expired link`);
}
