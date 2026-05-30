import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "Parameter 'eventId' is required." }, { status: 400 });
    }

    // Verify ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event || event.organizer_id !== user.id) {
      return NextResponse.json({ error: "Access Denied or Event not found." }, { status: 403 });
    }

    const supabaseAdmin = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Soft delete the event
    const { error } = await supabaseAdmin
      .from("events")
      .update({ 
        deleted_at: new Date().toISOString(),
        status: "cancelled" 
      })
      .eq("id", eventId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error processing request";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
