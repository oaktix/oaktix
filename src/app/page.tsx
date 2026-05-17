import { Search, MapPin, Calendar, ArrowRight, Ticket, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface FeaturedEvent {
  id?: string;
  title: string;
  start_date: string;
  location: string;
  price_naira: number;
  category: string;
  description: string;
  slug: string;
  gradient?: string;
  image_url?: string;
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch trending/featured events
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, description, location, start_date, price_naira, slug, category, image_url")
    .limit(3);

  // High-fidelity fallback events exactly matching the reference copy
  const featuredEvents = dbEvents && dbEvents.length > 0 ? dbEvents : [
    {
      title: "TechCon Nigeria 2026",
      start_date: "2026-07-02T09:00:00Z",
      location: "Landmark Centre, Lagos",
      price_naira: 8000,
      category: "Conferences",
      description: "Nigeria's premier technology summit connecting founders, developers, and global investors.",
      slug: "techcon-nigeria-2026",
      gradient: "from-[#0E4B31] to-[#2E7D32]"
    },
    {
      title: "Abuja Comedy Festival",
      start_date: "2026-08-16T20:00:00Z",
      location: "Transcorp Hilton, Abuja",
      price_naira: 10000,
      category: "Comedy",
      description: "An unforgettable evening of stand-up comedy featuring Nigeria's finest entertainers.",
      slug: "abuja-comedy-festival",
      gradient: "from-[#F19E23] to-[#E65100]"
    },
    {
      title: "Calabar Carnival Weekend",
      start_date: "2026-12-26T10:00:00Z",
      location: "Calabar City Centre, Calabar",
      price_naira: 5000,
      category: "Festivals",
      description: "Experience Africa's biggest street party—vibrant culture, spectacular music, and parades.",
      slug: "calabar-carnival-weekend",
      gradient: "from-[#0E4B31] to-[#F19E23]"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      
      {/* 1. Header Navigation */}
      <Navbar user={user} theme="transparent" />

      {/* Main Body */}
      <main className="flex-1 flex flex-col">
        
        {/* 2. Hero Section */}
        <div className="relative w-full overflow-hidden bg-[#0E4B31] pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-12 flex flex-col items-center">
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
              ✨ Nigeria's #1 ticketing marketplace
            </span>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight leading-tight mb-6 text-white">
              Find your next <br className="sm:hidden" />
              <span className="text-amber-500 block sm:inline">unforgettable night.</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-zinc-100/90 max-w-2xl mb-10 leading-relaxed font-medium">
              Concerts, conferences, festivals and more — discover thousands of live events across Nigeria. Book in seconds, walk in with a QR code.
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
                <ShieldCheck className="w-4 h-4 text-amber-500" /> Secure Paystack checkout
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
              {[
                { label: "Concerts", emoji: "🎤", count: "0 events" },
                { label: "Conferences", emoji: "🎯", count: "1 event" },
                { label: "Festivals", emoji: "🎉", count: "1 event" },
                { label: "Sports", emoji: "⚽", count: "1 event" },
                { label: "Theatre", emoji: "🎭", count: "0 events" },
                { label: "Comedy", emoji: "😂", count: "1 event" },
                { label: "Workshops", emoji: "🛠️", count: "1 event" },
                { label: "Parties", emoji: "🥳", count: "0 events" },
              ].map((cat, i) => (
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredEvents.map((event: FeaturedEvent, i: number) => {
                const date = event.start_date ? new Date(event.start_date) : null;
                const formattedDate = date ? date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Coming Soon";
                
                return (
                  <Link 
                    href={`/events/${event.slug}`} 
                    key={event.id || i}
                    className="glass-card overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 flex flex-col hover:shadow-md hover:shadow-indigo-500/5"
                  >
                    <div className="h-48 relative overflow-hidden bg-zinc-100 border-b border-[#E8EBE7]">
                      {event.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={event.image_url} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${event.gradient || "from-indigo-500/20 to-amber-500/20"} flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-500`}>
                          <Ticket className="w-12 h-12 text-indigo-500/40" />
                        </div>
                      )}
                      <span className="absolute top-4 left-4 bg-indigo-500 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
                        {event.category}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-indigo-500 text-xs font-bold mb-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 font-heading text-zinc-900 group-hover:text-indigo-500 transition-colors line-clamp-1">{event.title}</h3>
                        <p className="text-zinc-500 text-xs mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8EBE7]">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block uppercase">Tickets from</span>
                          <span className="text-base font-bold text-zinc-900">₦{event.price_naira?.toLocaleString()}</span>
                        </div>
                        <span className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          Book Tickets
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
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
                  List your event, set ticket types and prices, get paid via Paystack, and let attendees check in with QR codes — all from one dashboard.
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
