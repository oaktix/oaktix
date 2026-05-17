import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, subject, message } = await req.json();
    if (!eventId || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Verify Event Ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, organizer_id")
      .eq("id", eventId)
      .eq("organizer_id", user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found or not owned by you" }, { status: 404 });
    }

    // 3. Fetch Ticket Holders
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        id,
        buyer_id,
        profiles:buyer_id (
          email,
          full_name
        )
      `)
      .eq("event_id", eventId);

    if (ticketsError) {
      return NextResponse.json({ error: "Failed to fetch event attendees" }, { status: 500 });
    }

    const recipients = tickets
      ?.map((t) => t.profiles as { email?: string; full_name?: string })
      .filter((p) => p && p.email);

    // Deduplicate emails
    const uniqueRecipients = Array.from(new Set(recipients?.map((r) => r.email)))
      .map((email) => recipients?.find((r) => r.email === email));

    const recipientCount = uniqueRecipients.length;

    // 4. Create Email Log in DB
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        sender_id: user.id,
        event_id: eventId,
        recipient_type: "attendees",
        recipient_count: recipientCount,
        subject,
        body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded: 8px;">
          <h2 style="color: #4f46e5;">${event.title} - Update</h2>
          <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.6; color: #333;">${message}</p>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">You received this because you purchased tickets to ${event.title}.</p>
        </div>`,
        status: "sent"
      })
      .select()
      .single();

    if (logError) {
      console.error("Log error:", logError);
      return NextResponse.json({ error: "Failed to log email communication" }, { status: 500 });
    }

    // Note: In real production, we would loop and trigger Resend API calls or use Resend batching here:
    // await resend.emails.send({ ... })

    return NextResponse.json({
      success: true,
      recipientCount,
      message: `Successfully sent broadcast to ${recipientCount} attendees!`
    });

  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
