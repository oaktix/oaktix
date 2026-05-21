import { Search, ArrowRight, Ticket, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LatestEventsCarousel from "@/components/events/LatestEventsCarousel";


export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all events for homepage
  const { data: dbEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const allEvents = dbEvents || [];
  const carouselEvents = allEvents.slice(0, 4);

  // Fetch actual categories to get accurate dynamic event counts
  const { data: allCategoriesData } = await supabase
    .from("events")
    .select("category");

  const categoryCounts: Record<string, number> = {};
  if (allCategoriesData) {
    allCategoriesData.forEach((event) => {
      const cat = event.category || "Other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  }

  const defaultCategories = [
    { label: "Concerts", emoji: "🎤" },
    { label: "Conferences", emoji: "🎯" },
    { label: "Festivals", emoji: "🎉" },
    { label: "Sports", emoji: "⚽" },
    { label: "Theatre", emoji: "🎭" },
    { label: "Comedy", emoji: "😂" },
    { label: "Workshops", emoji: "🛠️" },
    { label: "Parties", emoji: "🥳" },
  ];

  const homepageCategories = defaultCategories.map(cat => {
    const count = categoryCounts[cat.label] || 0;
    return {
      ...cat,
      count: `${count} ${count === 1 ? 'event' : 'events'}`
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      
      {/* 1. Header Navigation */}
      <Navbar user={user} theme="light" />

      {/* Main Body */}
      <main className="flex-1 flex flex-col">
        
        {/* 2. Hero Section */}
        <div className="relative w-full overflow-hidden bg-[#0E4B31] pt-20 pb-20 md:pt-24 md:pb-28 px-6 md:px-12 flex flex-col items-center">
          {/* Background Image with Green Gradient Mask */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1920&q=80" 
              alt="Concert background" 
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0E4B31]/95 via-[#0E4B31]/90 to-[#0B3F29]/95 mix-blend-multiply" />
          </div>

          <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center mt-4">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-300 mb-6 uppercase tracking-wider">
              ✨ Nigeria&apos;s #1 ticketing marketplace
            </span>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight leading-tight mb-6 text-white">
              Find your next <br className="sm:hidden" />
              <span className="text-amber-500 block sm:inline">unforgettable night.</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-zinc-100/90 max-w-2xl mb-10 leading-relaxed font-medium">
              Concerts, conferences, festivals and more. Discover thousands of live events across Nigeria. Book in seconds, walk in with a QR code.
            </p>
            
            {/* Hero Search Bar */}
            <div className="bg-white/95 backdrop-blur-md border border-white/20 w-full max-w-3xl flex flex-col md:flex-row items-center p-2 rounded-2xl gap-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-4 py-3.5 w-full border-b border-zinc-200/50 md:border-b-0 md:border-r md:border-zinc-200/50">
                <Search className="w-5 h-5 text-indigo-500/70" />
                <input 
                  type="text" 
                  placeholder="Search artists, events, venues..." 
                  className="bg-transparent border-none outline-none w-full text-zinc-800 placeholder:text-zinc-400 text-sm font-medium focus:ring-0"
                />
              </div>
              <button className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
                Search events
              </button>
            </div>

            {/* Core Features bullets */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-10 text-xs font-bold text-white/90 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5 mr-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border border-white" />
                  <div className="w-5 h-5 rounded-full bg-zinc-200 border border-white" />
                  <div className="w-5 h-5 rounded-full bg-purple-500 border border-white" />
                </div>
                50,000+ happy fans
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" /> Secure Transactpay checkout
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Instant QR tickets
              </span>
            </div>
          </div>
        </div>

        {/* Content Centered Container */}
        <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-16 flex flex-col items-center">
          
          {/* 3. Browse by Category */}
          <div className="w-full mb-24 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-heading text-indigo-500 tracking-tight">Browse by category</h2>
              <p className="text-zinc-500 text-sm mt-1.5">Find exactly what you are looking for</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {homepageCategories.map((cat, i) => (
                <Link 
                  href={`/events?category=${cat.label}`} 
                  key={i} 
                  className="glass-card p-5 text-center hover:border-indigo-500/30 transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/5 group"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.emoji}</div>
                  <h4 className="font-bold text-sm text-zinc-800">{cat.label}</h4>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mt-1">{cat.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 4. Trending Now / Featured Events */}
          <div className="w-full mb-24 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold font-heading text-indigo-500 tracking-tight">Trending now</h2>
                <p className="text-zinc-500 text-sm mt-1.5">Featured events you don&apos;t want to miss</p>
              </div>
              <Link href="/events" className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 transition-colors font-bold text-sm mt-4 sm:mt-0 group">
                View all events <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {carouselEvents.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="w-full mb-10">
                  <LatestEventsCarousel events={carouselEvents} />
                </div>
                <Link 
                  href="/events"
                  className="px-8 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 group cursor-pointer"
                >
                  View More Events
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <div className="w-full text-center py-16 px-6 bg-white border border-[#E8EBE7] rounded-3xl shadow-sm">
                <Ticket className="w-12 h-12 text-indigo-500/30 mx-auto mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-zinc-800">No Events Scheduled Yet</h3>
                <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">Check back later or register as an organizer to list your own events!</p>
              </div>
            )}
          </div>

          {/* 5. For Event Organisers Section */}
          <div className="w-full mb-8 relative z-10">
            <div className="rounded-3xl bg-indigo-500/10 border border-indigo-500/20 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              
              <div className="lg:col-span-3 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-600 uppercase tracking-wide">
                  For event organisers
                </span>
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-indigo-600 tracking-tight leading-tight">
                  Sell tickets online in minutes.
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed max-w-lg">
                  List your event, set ticket types and prices, get paid via Transactpay, and let attendees check in with QR codes. Do it all from one dashboard.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link 
                    href="/signup" 
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm transition-all shadow-md shadow-amber-500/10"
                  >
                    List your event
                  </Link>
                  <Link 
                    href="/login" 
                    className="px-6 py-3 rounded-xl border border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/5 font-bold text-sm transition-all"
                  >
                    Organiser login
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                {[
                  { title: "0%", desc: "Setup fees" },
                  { title: "4%", desc: "Platform fee" },
                  { title: "24h", desc: "Payout time" },
                  { title: "QR", desc: "Instant check-in" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/80 p-5 rounded-2xl border border-indigo-500/10 text-center">
                    <div className="text-3xl font-bold font-heading text-indigo-500 mb-1">{stat.title}</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{stat.desc}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 6. Footer Section */}
      <Footer theme="light" />

    </div>
  );
}
