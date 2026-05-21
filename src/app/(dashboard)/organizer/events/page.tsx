import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Plus, MapPin, Eye } from "lucide-react";
import Image from "next/image";
import ShareButton from "@/components/organizer/ShareButton";
import ManageTiersButton from "@/components/organizer/ManageTiersButton";

export default async function VendorEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("*, tickets(count)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">My Events</h1>
            <p className="text-zinc-400">Manage your created events and performances.</p>
          </div>
        </div>
        <Link 
          href="/organizer/events/new"
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Event
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center text-center space-y-4 border-dashed border-white/5 bg-transparent">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-zinc-600" />
          </div>
          <div>
            <p className="text-lg font-bold">No events yet</p>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-1">Create your first event and start selling tickets.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => {
            const startDate = event.start_date ? new Date(event.start_date) : null;
            const ticketsSold = event.tickets?.[0]?.count || 0;

            return (
              <div key={event.id} className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between hover:border-indigo-500/30 transition-colors group">
                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <div className="w-24 h-24 rounded-xl bg-zinc-800 overflow-hidden relative shrink-0">
                    {event.featured_image ? (
                      <Image src={event.featured_image} alt={event.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-900/50 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-indigo-500/50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {startDate ? startDate.toLocaleDateString() : "TBA"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        {event.venue_details?.name || "Virtual"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Status</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      event.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Tickets Sold</p>
                    <p className="text-xl font-bold font-heading">{ticketsSold}</p>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <Link 
                      href={`/events/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-600/10 border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all text-sm font-bold text-zinc-300 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <Eye className="w-4 h-4" /> Preview
                    </Link>
                    <div className="w-full sm:w-auto">
                      <ShareButton slug={event.slug} />
                    </div>
                    <ManageTiersButton 
                      eventId={event.id}
                      eventTitle={event.title}
                      ticketTypes={event.ticket_types || []}
                    />
                    <Link 
                      href={`/organizer/events/${event.id}/edit`}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-sm font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
