import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface RegistrationTicketRow {
  id: string;
  unique_code: string | null;
  qr_code_url: string | null;
  event_id: string;
  buyer_id: string | null;
  ticket_type: { name?: string } | null;
  events: {
    id: string;
    title: string | null;
    type: string | null;
    organizer_id: string;
    start_date: string | null;
    venue_details: { name?: string } | null;
    virtual_details: { platform?: string; link?: string; password?: string } | null;
    featured_image: string | null;
  } | null;
  profiles: { email: string | null; full_name: string | null } | null;
}

/**
 * Parse + validate the `{ ticket_ids: string[] }` body, authenticate the
 * caller, then fetch the requested tickets (joined with their event +
 * buyer profile) and verify every event is owned by the caller.
 *
 * Returns either an error `NextResponse` or the validated context with a
 * service-role client and the loaded ticket rows.
 */
// The Supabase service-role client is intentionally loosely typed here so
// `.update()` calls (against tables not in the generated DB types) compile,
// matching the untyped service-client usage elsewhere in the codebase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = ReturnType<typeof createServiceClient<any, any>>;

export async function loadAndAuthorizeRegistrations(req: Request): Promise<
  | { error: NextResponse }
  | {
      service: ServiceClient;
      tickets: RegistrationTicketRow[];
      userId: string;
    }
> {
  let body: { ticket_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }

  const ticketIds = body.ticket_ids;
  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    return { error: NextResponse.json({ error: "ticket_ids is required" }, { status: 400 }) };
  }

  // Authenticate the caller via the cookie-based server client.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Service-role client to read across RLS + resolve buyer emails.
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tickets, error: ticketsError } = await service
    .from("tickets")
    .select(
      `
      id,
      unique_code,
      qr_code_url,
      event_id,
      buyer_id,
      ticket_type,
      events:event_id (
        id, title, type, organizer_id, start_date, venue_details, virtual_details, featured_image
      ),
      profiles:buyer_id ( email, full_name )
    `
    )
    .in("id", ticketIds);

  if (ticketsError) {
    return { error: NextResponse.json({ error: ticketsError.message }, { status: 500 }) };
  }
  if (!tickets || tickets.length === 0) {
    return { error: NextResponse.json({ error: "No tickets found" }, { status: 404 }) };
  }

  // AUTHORIZATION: every ticket's event must belong to the caller.
  const rows = tickets as unknown as RegistrationTicketRow[];
  const unauthorized = rows.some((t) => t.events?.organizer_id !== user.id);
  if (unauthorized) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { service, tickets: rows, userId: user.id };
}

/** Resolve the buyer email for a ticket, falling back to the auth admin API. */
export async function resolveBuyerEmail(
  service: ServiceClient,
  ticket: RegistrationTicketRow
): Promise<string | null> {
  if (ticket.profiles?.email) return ticket.profiles.email;
  if (ticket.buyer_id) {
    const { data } = await service.auth.admin.getUserById(ticket.buyer_id);
    return data?.user?.email ?? null;
  }
  return null;
}

/** Format an event's start date for emails, mirroring the free route. */
export function formatEventDate(startDate: string | null): string {
  if (!startDate) return "Date is listed on your dashboard";
  return new Date(startDate).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Whether an event is virtual (matches free-route logic). */
export function isVirtualEvent(ev: RegistrationTicketRow["events"]): boolean {
  return ev?.type === "virtual" || ev?.venue_details?.name === "Virtual";
}
