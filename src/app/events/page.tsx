import { Search, MapPin, SlidersHorizontal, Grid, List as ListIcon, Calendar, Ticket } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function DiscoverEvents({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; query?: string }>;
}) {
  const resolvedParams = await searchParams;
  const categoryFilter = resolvedParams.category || "All";
  const searchFilter = resolvedParams.query || "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch live published events from Supabase
  const { data: dbEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("start_date", { ascending: true });

  // Use live database events only
  const allEventsCombined = dbEvents || [];

  // Apply filters
  const filteredEvents = allEventsCombined.filter(event => {
    // 1. Category Filter
    if (categoryFilter !== "All" && event.category !== categoryFilter) {
      return false;
    }
    // 2. Search Text Filter
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const titleMatches = event.title?.toLowerCase().includes(q);
      const descMatches = event.description?.toLowerCase().includes(q);
      const locMatches = (event.location || event.venue_details?.name)?.toLowerCase().includes(q);
      return titleMatches || descMatches || locMatches;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden flex flex-col justify-between">
      
      {/* 1. Header Navigation - Styled Dark */}
      <Navbar user={user} theme="dark" />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full pt-32 pb-20 px-6 md:px-12">
        <div className="space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold font-heading tracking-tight mb-2">Discover Events</h1>
              <p className="text-zinc-500">Find the best experiences happening near you.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button aria-label="Switch to map view" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-sm font-bold text-zinc-300">
                <MapPin className="w-4 h-4 text-indigo-500" /> Map View
              </button>
              <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                <button aria-label="Grid view" className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg">
                  <Grid className="w-4 h-4" />
                </button>
                <button aria-label="List view" className="p-2 rounded-lg text-zinc-500 hover:text-white">
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Search & Filter Bar - HIGH CONTRAST DARK MODE */}
          <form method="GET" action="/events" className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col lg:flex-row items-center gap-4">
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl focus-within:border-indigo-500 transition-all">
              <Search className="w-5 h-5 text-indigo-500" />
              <input 
                name="query"
                type="text" 
                defaultValue={searchFilter}
                placeholder="Search by keyword, artist, or event..." 
                className="bg-transparent border-none outline-none w-full text-white placeholder:text-zinc-500 text-sm py-1 font-medium"
              />
            </div>
            
            <div className="w-full lg:w-48 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <select 
                aria-label="Filter by location" 
                title="Location" 
                className="bg-zinc-900 border-none outline-none w-full text-white text-sm py-1 font-medium cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-white">All States</option>
                <option value="lagos" className="bg-zinc-900 text-white">Lagos, NG</option>
                <option value="abuja" className="bg-zinc-900 text-white">Abuja, NG</option>
                <option value="calabar" className="bg-zinc-900 text-white">Calabar, NG</option>
              </select>
            </div>
            
            <div className="w-full lg:w-48 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <select 
                aria-label="Filter by date" 
                title="Date" 
                className="bg-zinc-900 border-none outline-none w-full text-white text-sm py-1 font-medium cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-white">Any Date</option>
                <option value="today" className="bg-zinc-900 text-white">Today</option>
                <option value="weekend" className="bg-zinc-900 text-white">This Weekend</option>
                <option value="month" className="bg-zinc-900 text-white">This Month</option>
              </select>
            </div>

            <button type="submit" className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold transition-all text-sm cursor-pointer shadow-lg shadow-amber-500/10">
              <SlidersHorizontal className="w-4 h-4" /> Search
            </button>
          </form>

          {/* 4. Categories Scrollable Filter */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {['All', 'Concerts', 'Conferences', 'Festivals', 'Sports', 'Theatre', 'Comedy', 'Workshops', 'Parties'].map((cat) => {
              const isActive = categoryFilter === cat;
              return (
                <Link
                  href={cat === 'All' ? '/events' : `/events?category=${cat}`}
                  key={cat}
                  className={`px-6 py-2.5 rounded-full border text-sm font-bold whitespace-nowrap transition-all ${
                    isActive 
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/10" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          {/* 5. Combined Live & Dummy Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
              {filteredEvents.map((event) => {
                const date = event.start_date ? new Date(event.start_date) : null;
                const formattedDate = date ? format(date, "MMM d • h:mm a") : "Coming Soon";
                
                return (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.slug}`}
                    className="bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-500/5"
                  >
                    <div>
                      <div className="h-56 relative overflow-hidden bg-zinc-900 border-b border-zinc-850">
                        {event.image_url || event.featured_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={event.image_url || event.featured_image} 
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient || "from-indigo-900/40 to-zinc-900"} flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-500`}>
                            <Ticket className="w-12 h-12 text-indigo-500/30" />
                          </div>
                        )}
                        <span className="absolute top-4 left-4 bg-indigo-500 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
                          {event.category}
                        </span>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-2 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 font-heading text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-sm mb-4">
                          <MapPin className="w-3.5 h-3.5 text-zinc-650" />
                          <span className="line-clamp-1">{event.location || event.venue_details?.name || "Virtual"}</span>
                        </div>
                        <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed mb-4">{event.description}</p>
                      </div>
                    </div>

                    <div className="p-6 pt-4 mt-auto border-t border-zinc-850/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wide">Tickets from</span>
                        <span className="text-lg font-bold text-white">
                          ₦{Number(event.price_naira || event.ticket_types?.[0]?.price || 0).toLocaleString()}
                        </span>
                      </div>
                      <span className="px-5 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all font-bold text-xs">
                        Book Tickets
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/40">
              <p className="text-zinc-500 text-sm font-medium">No events found matching your criteria.</p>
            </div>
          )}

        </div>
      </main>

      {/* 6. Footer Section - Styled Dark */}
      <Footer theme="dark" />

    </div>
  );
}
