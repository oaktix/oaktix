import { NextResponse } from "next/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

// 1×1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t");

  // Always return the pixel, regardless of token validity
  const gifResponse = new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });

  if (!token) return gifResponse;

  try {
    // Token format: base64(campaignId:recipientEmail)
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return gifResponse;

    const campaignId = decoded.slice(0, separatorIndex);
    // recipientEmail after first colon (email may contain colons in edge cases)

    const admin = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Mark the event as opened — idempotent upsert on tracking_token
    await admin
      .from("email_campaign_events")
      .update({
        event_type: "opened",
        opened_at: new Date().toISOString(),
      })
      .eq("tracking_token", token)
      .eq("event_type", "sent"); // only update if still 'sent' (don't overwrite 'opened')

    // Suppress any error — tracking failure must never affect the user
  } catch {
    // Silently ignore all tracking errors
  }

  return gifResponse;
}
