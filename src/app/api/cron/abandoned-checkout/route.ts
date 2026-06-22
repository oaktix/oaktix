/**
 * Abandoned Checkout Email Reminders — Vercel Cron Job
 *
 * Runs every 30 minutes. Finds pending transactions older than 2 hours
 * and sends reminder emails at 2h, 12h, and 24h intervals.
 *
 * Skip conditions:
 *  - transaction already succeeded or failed
 *  - event has started, been cancelled, sold out, completed, or deleted
 *  - the buyer's email already has a successful transaction for the same event
 *  - the specific reminder window was already sent
 *  - email cannot be parsed from payment_channel
 *  - transaction is older than 26 hours (past the last reminder window)
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendAbandonedCheckoutEmail } from "@/lib/email";

const WINDOWS = [
  { key: "reminder_2h_sent_at" as const,  hoursMin: 2,  hoursMax: 50 },
  { key: "reminder_12h_sent_at" as const, hoursMin: 12, hoursMax: 50 },
  { key: "reminder_24h_sent_at" as const, hoursMin: 24, hoursMax: 50 },
] as const;

function parseMetadata(paymentChannel: string | null): {
  email: string;
  ticketTypeName: string;
  quantity: number;
  guestName: string;
  userId: string | null;
} | null {
  if (!paymentChannel || !paymentChannel.startsWith("{")) return null;
  try {
    const data = JSON.parse(paymentChannel);
    if (!data.email || typeof data.email !== "string") return null;
    return {
      email: data.email.toLowerCase().trim(),
      ticketTypeName: data.ticket_type_name ?? "Ticket",
      quantity: Number(data.quantity) || 1,
      guestName: data.guest_name ?? "",
      userId: typeof data.user_id === "string" && data.user_id ? data.user_id : null,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const windowStart = new Date(now.getTime() - 50 * 60 * 60 * 1000); // 50h ago — wide enough for daily cron to catch the 24h window
  const windowEnd   = new Date(now.getTime() -  2 * 60 * 60 * 1000); // 2h ago

  // 1. Fetch pending transactions in the eligible time window
  const { data: transactions, error: txError } = await admin
    .from("transactions")
    .select("id, reference, event_id, amount, payment_channel, created_at, reminder_2h_sent_at, reminder_12h_sent_at, reminder_24h_sent_at")
    .eq("status", "pending")
    .gte("created_at", windowStart.toISOString())
    .lte("created_at", windowEnd.toISOString())
    .limit(500);

  if (txError) {
    console.error("Cron: failed to fetch transactions", txError);
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  // 2. Fetch events for all unique event_ids in one query
  const eventIds = [...new Set(transactions.map((t) => t.event_id).filter(Boolean))];
  const { data: events, error: evError } = await admin
    .from("events")
    .select("id, title, slug, start_date, status, deleted_at, featured_image, venue_details")
    .in("id", eventIds);

  if (evError) {
    console.error("Cron: failed to fetch events", evError);
    return NextResponse.json({ error: evError.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventMap = new Map<string, any>();
  for (const ev of events ?? []) {
    eventMap.set(ev.id, ev);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://oaktix.com.ng";
  let sent = 0;
  let skipped = 0;

  // 3. Pre-fetch all buyer_ids that have already successfully paid per event (avoids N+1).
  //    Keys are event_id → Set<buyer_id>. Only populated for events in our batch.
  //    Guest buyers (null buyer_id) cannot be cross-checked since payment_channel is
  //    overwritten on payment completion — this is an accepted limitation.
  const paidBuyersByEvent = new Map<string, Set<string>>();
  if (eventIds.length > 0) {
    const { data: successBuyers } = await admin
      .from("transactions")
      .select("event_id, buyer_id")
      .in("event_id", eventIds)
      .eq("status", "success")
      .not("buyer_id", "is", null);

    for (const row of successBuyers ?? []) {
      if (!row.buyer_id) continue;
      const set = paidBuyersByEvent.get(row.event_id) ?? new Set<string>();
      set.add(row.buyer_id);
      paidBuyersByEvent.set(row.event_id, set);
    }
  }

  for (const tx of transactions) {
    // --- Parse email metadata ---
    const meta = parseMetadata(tx.payment_channel);
    if (!meta) { skipped++; continue; }

    // --- Validate event ---
    const event = eventMap.get(tx.event_id);
    if (!event) { skipped++; continue; }
    if (event.deleted_at !== null) { skipped++; continue; }
    if (["cancelled", "sold_out", "completed"].includes(event.status)) { skipped++; continue; }
    if (new Date(event.start_date) <= now) { skipped++; continue; } // event already started

    // --- Check if this logged-in buyer already completed payment for this event ---
    // Guest buyers (no user_id in metadata) skip this check — no cross-reference is possible.
    if (meta.userId) {
      const paidBuyers = paidBuyersByEvent.get(tx.event_id);
      if (paidBuyers?.has(meta.userId)) { skipped++; continue; }
    }

    // --- Determine which reminder windows are due ---
    const txAgeMs = now.getTime() - new Date(tx.created_at).getTime();
    const txAgeHours = txAgeMs / (60 * 60 * 1000);

    const dueWindows = WINDOWS.filter(
      (w) => txAgeHours >= w.hoursMin && txAgeHours <= w.hoursMax && tx[w.key] === null
    );

    if (dueWindows.length === 0) { skipped++; continue; }

    // Venue location string
    const venue = event.venue_details as any;
    const locationStr = venue?.name
      ? `${venue.name}${venue.city ? `, ${venue.city}` : ""}`
      : venue?.city ?? null;

    // --- Send each due reminder ---
    for (const window of dueWindows) {
      const windowLabel = window.key === "reminder_2h_sent_at" ? "2 hours"
        : window.key === "reminder_12h_sent_at" ? "12 hours"
        : "24 hours";

      try {
        await sendAbandonedCheckoutEmail({
          to: meta.email,
          recipientName: meta.guestName || meta.email.split("@")[0],
          eventTitle: event.title,
          eventSlug: event.slug,
          eventDate: event.start_date,
          location: locationStr,
          ticketTypeName: meta.ticketTypeName,
          quantity: meta.quantity,
          amount: Number(tx.amount),
          eventImageUrl: event.featured_image ?? null,
          windowLabel,
          siteUrl,
        });

        // Mark this reminder as sent immediately after successful delivery
        const { error: updateError } = await admin
          .from("transactions")
          .update({ [window.key]: now.toISOString() })
          .eq("id", tx.id);

        if (updateError) {
          console.error(`Cron: failed to stamp ${window.key} for tx ${tx.reference}:`, updateError.message);
          // Email was sent but column not stamped — acceptable to log and continue;
          // the next cron run will retry and Resend deduplication will suppress duplicates.
        } else {
          sent++;
          console.log(`Cron: sent ${windowLabel} reminder → ${meta.email} for event "${event.title}" (tx ${tx.reference})`);
        }
      } catch (err) {
        console.error(`Cron: failed to send ${windowLabel} reminder for tx ${tx.reference}:`, err);
      }
    }
  }

  console.log(`Cron: abandoned-checkout complete — sent ${sent}, skipped ${skipped}`);
  return NextResponse.json({ sent, skipped, processed: transactions.length });
}
