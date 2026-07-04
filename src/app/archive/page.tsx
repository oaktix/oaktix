import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Ticket, Calendar, MapPin } from "lucide-react";

export const metadata = {
  title: "Past Events Archive | OakTix",
  description: "Browse past events hosted on OakTix.",
};

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all published events
  const { data: dbEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const allEvents = dbEvents || [];
  
  const thresholdTime = new Date(Date.now() - 3 * 60 * 60 * 1000).getTime();
  
  // Filter only past events
  const pastEvents = allEvents.filter(e => {
    const end = e.end_date ? new Date(e.end_date).getTime() : new Date(e.start_date).getTime();
    return end < thresholdTime;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      <Navbar user={user} theme="light" />

      <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-6 md:px-12 py-32">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-indigo-500 tracking-tight">Past Events Archive</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg mt-3 max-w-2xl">
            A collection of unforgettable experiences that have already taken place. Browse through past events hosted on OakTix.
          </p>
        </div>

        {pastEvents.length === 0 ? (
          <div className="w-full text-center py-24 px-6 bg-white dark:bg-zinc-900/50 border border-[#E8EBE7] dark:border-white/10 rounded-3xl shadow-sm">
            <Ticket className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">No past events yet</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">Events will appear here once their scheduled dates have passed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pastEvents.map((event) => (
              <Link href={`/events/${event.slug}`} key={event.id} className="block group">
                <div className="glass-card overflow-hidden h-full flex flex-col border border-zinc-200/50 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-lg hover:shadow-zinc-200 dark:hover:shadow-none transition-all duration-300 bg-white dark:bg-zinc-900/40">
                  <div className="relative h-48 w-full bg-zinc-800 overflow-hidden shrink-0">
                    {event.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.featured_image} alt={event.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                        <Ticket className="w-10 h-10 text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded border border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                      Event Ended
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg font-heading text-zinc-800 dark:text-zinc-100 line-clamp-2 mb-2 group-hover:text-indigo-500 transition-colors">{event.title}</h3>
                    
                    <div className="mt-auto space-y-2 pt-4 border-t border-zinc-100 dark:border-white/5">
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {event.start_date ? new Date(event.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                      </p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.venue_details?.name || 'Virtual Event'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer theme="light" />
    </div>
  );
}
