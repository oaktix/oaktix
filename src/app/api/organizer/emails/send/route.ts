import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

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

    // 5. Dispatch broadcast updates using Resend
    const resend = new Resend(process.env.RESEND_API_KEY!);
    
    if (uniqueRecipients && uniqueRecipients.length > 0) {
      await Promise.all(
        uniqueRecipients.map(async (recipient) => {
          if (recipient?.email) {
            try {
              await resend.emails.send({
                from: "OakTix <hello@oaktix.com.ng>",
                to: recipient.email,
                subject: `${event.title}: ${subject}`,
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
                  <div style="background: linear-gradient(135deg, #0E4B31 0%, #1a6b47 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0; color: #ffffff;">
                    <span style="font-size: 24px;">🎟️</span>
                    <h2 style="margin: 8px 0 0 0; font-size: 20px; color: #ffffff;">${event.title}</h2>
                  </div>
                  <div style="padding: 24px; color: #333333;">
                    <p style="font-size: 15px; font-weight: bold; margin-top: 0; color: #1A1A1A;">Hello ${recipient.full_name || "Valued Guest"},</p>
                    <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #4A5568; margin-bottom: 0;">${message}</p>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
                  <p style="font-size: 11px; color: #718096; text-align: center; margin: 0;">
                    You received this broadcast update because you purchased tickets to <strong>${event.title}</strong>.<br/>
                    Need support? Reply to <a href="mailto:hello@oaktix.com.ng" style="color: #0E4B31; text-decoration: underline;">hello@oaktix.com.ng</a>
                  </p>
                </div>`,
              });
            } catch (err) {
              console.error(`Failed to send broadcast email to ${recipient.email}:`, err);
            }
          }
        })
      );
    }

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
