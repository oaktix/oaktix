import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import TicketCard from "@/components/dashboard/TicketCard";
import { Ticket as TicketIcon } from "lucide-react";

export default async function MyTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch tickets for the current user
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(`
      *,
      events:event_id (
        id,
        title,
        start_date,
        venue_details,
        slug,
        featured_image
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <TicketIcon className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">My Tickets</h1>
          <p className="text-zinc-400">Manage and view your upcoming event passes.</p>
        </div>
      </div>

      {!tickets || tickets.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center text-center space-y-4 border-dashed border-white/5 bg-transparent">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <TicketIcon className="w-8 h-8 text-zinc-600" />
          </div>
          <div>
            <p className="text-lg font-bold">No tickets found</p>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-1">You haven&apos;t purchased any tickets yet.</p>
          </div>
          <Link href="/events" className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors mt-4">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id || ticket.unique_code} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
