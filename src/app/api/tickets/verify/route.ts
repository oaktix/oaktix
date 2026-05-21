import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate Scanner (Staff or Organizer)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, ticketCode } = await req.json();
    if (!eventId || !ticketCode) {
      return NextResponse.json({ error: "Missing eventId or ticketCode" }, { status: 400 });
    }

    // 2. Authorize: Check if user is organizer of this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id, title")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let isAuthorized = event.organizer_id === user.id;

    if (!isAuthorized) {
      // Check if user is a registered scanner for this event
      const { data: scanner } = await supabase
        .from("scanners")
        .select("id")
        .eq("event_id", eventId)
        .eq("staff_id", user.id)
        .single();

      if (scanner) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "You are not authorized to scan for this event" }, { status: 403 });
    }

    // 3. Retrieve Ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        profiles:buyer_id (
          full_name,
          email
        )
      `)
      .eq("unique_code", ticketCode)
      .eq("event_id", eventId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found or doesn't belong to this event" }, { status: 404 });
    }

    // 4. Validate Ticket Status
    if (ticket.status === "used") {
      return NextResponse.json({ 
        error: "Ticket already scanned!", 
        code: "ALREADY_SCANNED",
        scannedAt: ticket.scanned_at,
        ticket 
      }, { status: 400 });
    }

    if (ticket.status !== "active") {
      return NextResponse.json({ 
        error: `This ticket is invalid (${ticket.status})`, 
        code: "INVALID_STATUS",
        ticket 
      }, { status: 400 });
    }

    // 5. Mark as scanned using admin client to bypass RLS policies
    const admin = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: updatedTicket, error: updateError } = await admin
      .from("tickets")
      .update({
        status: "used",
        scanned_at: new Date().toISOString(),
        scanned_by: user.id
      })
      .eq("id", ticket.id)
      .select(`
        *,
        profiles:buyer_id (
          full_name,
          email
        )
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Failed to verify ticket" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Ticket successfully verified!",
      ticket: updatedTicket
    });

  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
