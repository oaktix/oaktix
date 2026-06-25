import { NextResponse } from "next/server";
import { sendRegistrationApprovedEmail } from "@/lib/email";
import {
  loadAndAuthorizeRegistrations,
  resolveBuyerEmail,
  formatEventDate,
  isVirtualEvent,
  RegistrationTicketRow,
} from "../_shared";

/**
 * Approve (or promote from waitlist) one or more registrations.
 * Promotion from waitlist is treated exactly like approval — the approved
 * email (with meeting link for virtual events) is sent.
 */
export async function POST(req: Request) {
  const ctx = await loadAndAuthorizeRegistrations(req);
  if ("error" in ctx) return ctx.error;
  const { service, tickets } = ctx;

  // Flip status to approved.
  const ids = tickets.map((t) => t.id);
  const { error: updateError } = await service
    .from("tickets")
    .update({ registration_status: "approved" })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Group tickets by event + buyer so each buyer gets one email with all their QR codes.
  const groups = new Map<string, RegistrationTicketRow[]>();
  for (const t of tickets) {
    const key = `${t.event_id}::${t.buyer_id ?? "guest"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  for (const group of groups.values()) {
    const first = group[0];
    const ev = first.events;
    const email = await resolveBuyerEmail(service, first);
    if (!email || !ev) continue;

    const virtual = isVirtualEvent(ev);
    await sendRegistrationApprovedEmail({
      to: email,
      eventTitle: ev.title || "Your OakTix Event",
      eventDate: formatEventDate(ev.start_date),
      eventLocation: ev.venue_details?.name || "Venue is listed on your dashboard",
      isVirtual: virtual,
      meetingLink: virtual ? ev.virtual_details?.link : undefined,
      meetingPassword: virtual ? ev.virtual_details?.password : undefined,
      tickets: group.map((t) => ({
        uniqueCode: t.unique_code || "",
        qrCodeUrl: t.qr_code_url || "",
      })),
      eventBannerUrl: ev.featured_image || "",
    });
  }

  return NextResponse.json({ success: true, updated: ids.length });
}
