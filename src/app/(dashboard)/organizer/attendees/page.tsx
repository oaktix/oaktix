import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AttendeeTable from "@/components/organizer/AttendeeTable";
import { Users } from "lucide-react";

export default async function AttendeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch organizer's events first to populated drop-down
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id);

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
  }

  const eventIds = events?.map(e => e.id) || [];

  // Fetch tickets for all events owned by organizer
  let tickets: any[] = [];
  if (eventIds.length > 0) {
    const { data: tk, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        *,
        events:event_id (
          id,
          title,
          organizer_id
        ),
        profiles:buyer_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .in("event_id", eventIds);

    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
    } else {
      tickets = tk || [];
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Attendee Management</h1>
          <p className="text-zinc-400">View guest lists, search for orders, and export details.</p>
        </div>
      </div>

      <AttendeeTable 
        initialTickets={tickets || []} 
        events={events || []} 
      />
    </div>
  );
}
