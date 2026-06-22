import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/events/upsert
 *
 * Super-admin / admin event create OR update using the service-role client
 * so that RLS does not block cross-organiser edits.
 *
 * Body shape:
 *   { eventId?: string, payload: EventPayload }
 *
 * If eventId is absent a new event is inserted with organizer_id = caller's user.id.
 * If eventId is present the existing event is updated (no organizer_id change).
 */
export async function POST(req: Request) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────────────
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role || user.user_metadata?.role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // ── 2. Parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { eventId, payload } = body as {
      eventId?: string;
      payload: Record<string, unknown>;
    };

    if (!payload) {
      return NextResponse.json(
        { error: "Missing 'payload' in request body." },
        { status: 400 }
      );
    }

    // ── 3. Service-role client (bypasses RLS) ────────────────────────────────
    const supabaseAdmin = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (eventId) {
      // ── Update ──────────────────────────────────────────────────────────
      const { error } = await supabaseAdmin
        .from("events")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", eventId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, eventId });
    } else {
      // ── Insert ──────────────────────────────────────────────────────────
      const { data: inserted, error } = await supabaseAdmin
        .from("events")
        .insert({ ...payload, organizer_id: user.id })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, eventId: inserted.id });
    }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error processing request";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
