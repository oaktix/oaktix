import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function authorizeAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, allowed: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role || user.user_metadata?.role;
  return { user, allowed: role === "admin" || role === "super_admin" };
}

export async function GET() {
  const { user, allowed } = await authorizeAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch campaigns with open counts
    const { data: campaigns, error } = await admin
      .from("email_campaigns")
      .select("id, subject, target, recipient_count, sent_count, failed_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Table may not exist yet if migration hasn't been applied
      if (error.code === "42P01") {
        return NextResponse.json({ campaigns: [], migrationNeeded: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    // Fetch open counts per campaign
    const campaignIds = campaigns.map((c: any) => c.id);
    const { data: openEvents } = await admin
      .from("email_campaign_events")
      .select("campaign_id")
      .eq("event_type", "opened")
      .in("campaign_id", campaignIds);

    // Count opens per campaign
    const openCounts: Record<string, number> = {};
    for (const ev of openEvents ?? []) {
      openCounts[ev.campaign_id] = (openCounts[ev.campaign_id] ?? 0) + 1;
    }

    const result = campaigns.map((c: any) => ({
      ...c,
      open_count: openCounts[c.id] ?? 0,
      open_rate: c.sent_count > 0
        ? Math.round(((openCounts[c.id] ?? 0) / c.sent_count) * 100)
        : 0,
    }));

    return NextResponse.json({ campaigns: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
