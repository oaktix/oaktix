import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Heart, Calendar, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function SavedEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch saved/liked events for this user
  // Let's check if there is a likes or bookmarks table, otherwise fetch empty list with a premium placeholder
  const { data: savedEvents } = await supabase
    .from("saved_events")
    .select(`
      *,
      events (
        id,
        title,
        description,
        start_date,
        location,
        image_url,
        price
      )
    `)
    .eq("user_id", user.id);

  const events = savedEvents?.map(s => s.events).filter(Boolean) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500/10" /> Saved Events
        </h1>
        <p className="text-zinc-500">Events you are interested in and have bookmarked for later.</p>
      </div>

      {events.length === 0 ? (
        <div className="glass-card p-16 text-center bg-white border border-[#E8EBE7] shadow-sm max-w-xl mx-auto rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold font-heading text-zinc-900 mb-2">No saved events yet</h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Browse upcoming concerts, festivals, and business events to bookmark them and keep track of ticket releases.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-lg shadow-indigo-500/10"
          >
            Explore Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <div key={event.id} className="glass-card overflow-hidden bg-white border border-[#E8EBE7] shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full rounded-2xl">
              {/* Event Image */}
              <div className="h-48 w-full bg-zinc-100 relative overflow-hidden">
                {event.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500">
                    <Calendar className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                </div>
              </div>

              {/* Event Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg font-heading text-zinc-900 line-clamp-1 group-hover:text-indigo-500 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E8EBE7] mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{new Date(event.start_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between mt-2">
                  <span className="font-bold text-sm text-zinc-900">
                    {event.price === 0 ? "Free" : `₦${Number(event.price).toLocaleString()}`}
                  </span>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    View details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
