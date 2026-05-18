import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ShieldCheck, Share2, Heart, Info, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import EventDetailsClient from "@/components/events/EventDetailsClient";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Check for high-fidelity predefined fallback dummy events
  const dummyEvents = {
    "techcon-nigeria-2026": {
      id: "dummy-techcon-2026",
      title: "TechCon Nigeria 2026",
      start_date: "2026-07-02T09:00:00Z",
      location: "Landmark Centre, Lagos",
      price_naira: 8000,
      category: "Conferences",
      max_attendees: 1500,
      description: "Nigeria's premier technology summit connecting founders, developers, and global investors. Join industry pioneers as we discuss artificial intelligence, blockchain engineering, capital financing, and fintech infrastructure within the African continent.",
      slug: "techcon-nigeria-2026",
      venue_details: { name: "Landmark Centre", address: "Plot 2 & 3, Water Corporation Dr, Victoria Island, Lagos" },
      featured_image: null,
      image_url: null,
      gradient: "from-[#0E4B31] to-[#2E7D32]",
      absorb_fees: false,
      ticket_types: [
        { name: "Regular Delegate Pass", price: 8000, description: "Full access to keynotes, workshops, and panels.", perks: ["General Seating", "Certificate"] },
        { name: "VIP Executive Ticket", price: 25000, description: "Front-row seats, lounge access, and exclusive network dinners.", perks: ["Networking Lounge", "VIP Dinner", "Premium Swag"] }
      ],
      organizer: {
        id: "oaktix-live",
        full_name: "OakTix Live",
        avatar_url: null,
        vendor_details: {
          business_name: "OakTix Live",
          bio: "Official OakTix curator of top-tier concerts and festivals."
        }
      }
    },
    "abuja-comedy-festival": {
      id: "dummy-abuja-comedy-2026",
      title: "Abuja Comedy Festival",
      start_date: "2026-08-16T20:00:00Z",
      location: "Transcorp Hilton, Abuja",
      price_naira: 10000,
      category: "Comedy",
      max_attendees: 800,
      description: "An unforgettable evening of stand-up comedy featuring Nigeria's finest entertainers. Brace yourself for premium laughter, musical performances, and special guest appearances by award-winning acts.",
      slug: "abuja-comedy-festival",
      venue_details: { name: "Transcorp Hilton", address: "1 Aguiyi Ironsi St, Maitama, Abuja" },
      featured_image: null,
      image_url: null,
      gradient: "from-[#F19E23] to-[#E65100]",
      absorb_fees: false,
      ticket_types: [
        { name: "General Admission", price: 10000, description: "Standard single seat access.", perks: ["Standard Row Seating"] },
        { name: "VIP Table Reservation", price: 50000, description: "Premium table seating with complimentary refreshments.", perks: ["Front Row Table", "Complimentary Drinks", "Photo Session"] }
      ],
      organizer: {
        id: "triad-party",
        full_name: "Triad Party",
        avatar_url: null,
        vendor_details: {
          business_name: "Triad Party",
          bio: "Making Ibadan nightlife memorable."
        }
      }
    },
    "calabar-carnival-weekend": {
      id: "dummy-calabar-carnival-2026",
      title: "Calabar Carnival Weekend",
      start_date: "2026-12-26T10:00:00Z",
      location: "Calabar City Centre, Calabar",
      price_naira: 5000,
      category: "Festivals",
      max_attendees: 5000,
      description: "Experience Africa's biggest street party—vibrant culture, spectacular music, costumed parades, and authentic culinary journeys from the heart of Cross River State. A celebration you don't want to miss.",
      slug: "calabar-carnival-weekend",
      venue_details: { name: "Calabar City Centre", address: "Eleven-Eleven Roundabout, Calabar" },
      featured_image: null,
      image_url: null,
      gradient: "from-[#0E4B31] to-[#F19E23]",
      absorb_fees: false,
      ticket_types: [
        { name: "Standard Carnival Pass", price: 5000, description: "Access to the main festival grounds, food courts, and parades.", perks: ["General Entry"] },
        { name: "Super VIP Weekend Package", price: 30000, description: "Exclusive elevated stage viewing, security, and standard bar access.", perks: ["VIP Stage", "Dedicated Security", "VIP Bar Pass"] }
      ],
      organizer: {
        id: "oaktix-live",
        full_name: "OakTix Live",
        avatar_url: null,
        vendor_details: {
          business_name: "OakTix Live",
          bio: "Official OakTix curator of top-tier concerts and festivals."
        }
      }
    }
  };

  let event = dummyEvents[slug as keyof typeof dummyEvents] || null;

  // 2. Query dynamic DB event if slug is not matched in dummy list
  if (!event) {
    const { data: dbEvent } = await supabase
      .from("events")
      .select("*, organizer:profiles(*)")
      .eq("slug", slug)
      .single();

    event = dbEvent;
  }

  if (!event) {
    notFound();
  }

  const startDate = new Date(event.start_date);
  const ticketTypes = event.ticket_types || [];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between overflow-hidden">
      
      {/* 1. Navigation Header - Styled Dark */}
      <Navbar user={user} theme="dark" />

      <div className="flex-1 w-full pt-16">
        {/* 2. Hero Header Image Banner */}
        <div className="relative h-[50vh] w-full overflow-hidden">
          {event.image_url || event.featured_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={event.image_url || event.featured_image || undefined} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${event.gradient || "from-indigo-950 to-zinc-950"}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <Link 
                  href="/events" 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors mb-2 uppercase tracking-wide cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
                </Link>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  {format(startDate, "EEEE, MMMM do, yyyy")}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold font-heading tracking-tight text-white">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-zinc-300">
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    {event.venue_details?.name || "Virtual Event"}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <Users className="w-4 h-4 text-indigo-500" />
                    {event.max_attendees || "Uncapped"} Capacity
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button aria-label="Add to favorites" className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-850 transition-all text-white cursor-pointer">
                  <Heart className="w-5 h-5" />
                </button>
                <button aria-label="Share event" className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-850 transition-all text-white cursor-pointer">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Details Grid */}
        <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading text-white">About this Event</h2>
              <p className="text-zinc-400 leading-relaxed text-base">
                {event.description || "No description provided for this event."}
              </p>
            </section>

            {/* Ticket Tiers */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-heading text-white">Select Tickets</h2>
              {ticketTypes.length > 0 ? (
                <EventDetailsClient 
                  event={{
                    id: event.id,
                    title: event.title,
                    slug: event.slug,
                    ticket_types: ticketTypes,
                    absorb_fees: event.absorb_fees
                  }} 
                  user={user ? { id: user.id, email: user.email || "" } : null} 
                />
              ) : (
                <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 bg-zinc-950/40 rounded-2xl font-bold">
                  Tickets are not yet available for this event.
                </div>
              )}
            </section>

            {/* Organizer Info */}
            <section className="p-6 flex flex-col sm:flex-row items-center gap-6 border border-zinc-850 bg-zinc-950/60 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-zinc-900 overflow-hidden relative shrink-0">
                {event.organizer?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.organizer.avatar_url} alt={event.organizer.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-indigo-500/10 text-indigo-400">
                    {event.organizer?.full_name?.[0] || "O"}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Organized By</p>
                <h3 className="text-lg font-bold font-heading mb-1 text-white">{event.organizer?.vendor_details?.business_name || event.organizer?.full_name}</h3>
                <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{event.organizer?.vendor_details?.bio || "A verified Oaktix organizer curation."}</p>
              </div>
            </section>
          </div>

          {/* Right Column: Side Card */}
          <div className="space-y-8">
            <div className="p-6 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-6 sticky top-24">
              <div className="space-y-4">
                <h3 className="font-bold font-heading text-lg text-white">Event Details</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Date & Time</p>
                      <p className="text-zinc-500 text-xs">{format(startDate, "PPP")}</p>
                      <p className="text-zinc-500 text-xs">{format(startDate, "p")} (WAT)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Location</p>
                      <p className="text-zinc-500 text-xs">{event.venue_details?.name || "Online"}</p>
                      <p className="text-zinc-650 text-[10px] mt-0.5">{event.venue_details?.address}</p>
                    </div>
                  </div>

                  {event.venue_details?.address && event.venue_details?.address.toLowerCase() !== "online" && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800 h-44 w-full relative">
                      <iframe
                        title="Event Location Map"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue_details.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full border-0 opacity-80 hover:opacity-100 transition-opacity"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-zinc-850/60">
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Verified & Secure Transaction
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                  <Info className="w-4 h-4 text-indigo-500" />
                  Refunds available until 48h before
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Footer Section - Styled Dark */}
      <Footer theme="dark" />

    </div>
  );
}
