import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendCampaignEmail } from "@/lib/email";

async function authorizeAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, allowed: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role || user.user_metadata?.role;
  return { user, allowed: role === "admin" || role === "super_admin" };
}

export async function POST(req: Request) {
  const { user, allowed } = await authorizeAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { target, subject, body, recipientEmail, recipientName, recipients: recipientsPayload } = await req.json();

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }

  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let recipients: { email: string; name: string }[] = [];

  if (target === "individual") {
    // Support both legacy single-recipient and new multi-recipient array
    if (Array.isArray(recipientsPayload) && recipientsPayload.length > 0) {
      recipients = recipientsPayload.map((r: { email: string; name?: string }) => ({
        email: r.email,
        name: r.name || r.email.split("@")[0],
      }));
    } else if (recipientEmail) {
      recipients = [{ email: recipientEmail, name: recipientName || recipientEmail.split("@")[0] }];
    } else {
      return NextResponse.json({ error: "At least one recipient is required for individual send." }, { status: 400 });
    }
  } else {
    // Fetch emails based on target group
    let query = admin.from("profiles").select("full_name, email").not("email", "is", null);

    if (target === "attendees") {
      query = query.eq("role", "user");
    } else if (target === "vendors") {
      query = query.eq("role", "vendor");
    } else if (target === "professionals") {
      // professionals use a separate table — fetch from professionals + join user profile email
      const { data: profs } = await admin
        .from("professionals")
        .select("professional_name, email, user_id")
        .eq("status", "approved");

      const profRecipients: { email: string; name: string }[] = [];
      for (const p of profs || []) {
        if (p.email) {
          profRecipients.push({ email: p.email, name: p.professional_name });
        } else if (p.user_id) {
          const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", p.user_id).maybeSingle();
          if (profile?.email) profRecipients.push({ email: profile.email, name: profile.full_name || p.professional_name });
        }
      }
      recipients = profRecipients;
      query = null as any; // skip the profile query below
    } else {
      // all — no role filter
    }

    if (target !== "professionals") {
      const { data: profiles } = await (query as any);
      recipients = (profiles || []).map((p: any) => ({
        email: p.email,
        name: p.full_name || p.email?.split("@")[0] || "Member",
      }));
    }
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients found for the selected group." }, { status: 400 });
  }

  // Convert plain body text to basic HTML (preserve line breaks)
  const bodyHtml = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  // Send emails (fire-and-forget; log failures, don't stop on individual errors)
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const r of recipients) {
    try {
      const ok = await sendCampaignEmail({
        to: r.email,
        recipientName: r.name,
        subject,
        bodyHtml,
      });
      if (ok) sent++;
      else failed++;
    } catch (err) {
      failed++;
      errors.push(`${r.email}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ success: true, sent, failed, total: recipients.length, errors: errors.slice(0, 5) });
}
