import { NextResponse } from "next/server";
import { sendRegistrationWaitlistEmail } from "@/lib/email";
import {
  loadAndAuthorizeRegistrations,
  resolveBuyerEmail,
  formatEventDate,
  isVirtualEvent,
} from "../_shared";

/** Move one or more registrations to the waitlist and notify each registrant. */
export async function POST(req: Request) {
  const ctx = await loadAndAuthorizeRegistrations(req);
  if ("error" in ctx) return ctx.error;
  const { service, tickets } = ctx;

  const ids = tickets.map((t) => t.id);
  const { error: updateError } = await service
    .from("tickets")
    .update({ registration_status: "waitlist" })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const seen = new Set<string>();
  for (const t of tickets) {
    const key = `${t.event_id}::${t.buyer_id ?? "guest"}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ev = t.events;
    const email = await resolveBuyerEmail(service, t);
    if (!email || !ev) continue;

    await sendRegistrationWaitlistEmail({
      to: email,
      eventTitle: ev.title || "Your OakTix Event",
      eventDate: formatEventDate(ev.start_date),
      eventLocation: ev.venue_details?.name || "Venue is listed on your dashboard",
      isVirtual: isVirtualEvent(ev),
      eventBannerUrl: ev.featured_image || "",
    });
  }

  return NextResponse.json({ success: true, updated: ids.length });
}
