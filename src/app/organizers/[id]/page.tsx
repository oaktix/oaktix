import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, Users, ArrowLeft, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, vendor_details")
    .eq("id", id)
    .eq("role", "vendor")
    .maybeSingle();

  const name = (profile?.vendor_details as any)?.business_name || profile?.full_name || "Organizer";
  return {
    title: `${name} — Event Organizer | OakTix`,
    description: `Discover events by ${name} on OakTix. View their active and past events.`,
  };
}

export default async function OrganizerProfilePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Use admin client to fetch organizer profile (bypasses RLS for profile lookup)
  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, vendor_details, email, created_at")
    .eq("id", id)
    .eq("role", "vendor")
    .maybeSingle();

  if (!profile) notFound();

  const vendorDetails = (profile.vendor_details as any) || {};
  const displayName = vendorDetails.business_name || profile.full_name || "Organizer";
  const bio = vendorDetails.bio || null;
  const initials = displayName.charAt(0).toUpperCase();

  const now = new Date().toISOString();

  // Active events: published + start_date in the future
  const { data: activeEvents } = await admin
    .from("events")
    .select("id, title, slug, start_date, featured_image, venue_details, ticket_types, status")
    .eq("organizer_id", id)
    .eq("status", "published")
    .gt("start_date", now)
    .is("deleted_at", null)
    .order("start_date", { ascending: true })
    .limit(12);

  // Past events: start_date in the past OR status completed/cancelled
  const { data: pastEvents } = await admin
    .from("events")
    .select("id, title, slug, start_date, featured_image, venue_details, status")
    .eq("organizer_id", id)
    .in("status", ["published", "completed", "sold_out", "cancelled"])
    .lt("start_date", now)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })
    .limit(12);

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long" });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      <Navbar user={user} theme="light" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0E4B31] to-[#1a6b47] pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/vendors" className="inline-flex items-center gap-1.5 text-indigo-200/70 hover:text-white text-xs font-medium mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to organizers
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-white">{initials}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">{displayName}</h1>
              <p className="text-indigo-200/70 text-sm mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Member since {memberSince}
              </p>
            </div>
          </div>
          {bio && (
            <p className="text-indigo-100/80 text-sm mt-6 max-w-2xl leading-relaxed">{bio}</p>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-14">
        {/* Active Events */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <h2 className="text-xl font-bold font-heading text-zinc-900">
              Active Events
              {activeEvents && activeEvents.length > 0 && (
                <span className="ml-2 text-sm font-semibold text-zinc-400">({activeEvents.length})</span>
              )}
            </h2>
          </div>

          {!activeEvents || activeEvents.length === 0 ? (
            <div className="glass-card p-10 bg-white border border-[#E8EBE7] text-center rounded-2xl">
              <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="font-bold text-zinc-700">No active events right now</p>
              <p className="text-zinc-500 text-sm mt-1">Check back later for upcoming events from this organizer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeEvents.map((event) => (
                <EventCard key={event.id} event={event} active />
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastEvents && pastEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400"></span>
              <h2 className="text-xl font-bold font-heading text-zinc-900">
                Past Events
                <span className="ml-2 text-sm font-semibold text-zinc-400">({pastEvents.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} active={false} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer theme="light" />
    </div>
  );
}

function EventCard({ event, active }: {
  event: {
    id: string;
    title: string;
    slug: string | null;
    start_date: string;
    featured_image?: string | null;
    venue_details?: { name?: string; address?: string } | null;
    status: string;
  };
  active: boolean;
}) {
  const dateStr = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(event.start_date));
  const venue = (event.venue_details as any)?.name || "Venue TBA";

  const CardContent = () => (
    <div className={`glass-card bg-white border border-[#E8EBE7] rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 ${!active ? "opacity-75" : ""}`}>
      <div className="h-40 bg-gradient-to-br from-indigo-900 to-zinc-900 relative overflow-hidden">
        {event.featured_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.featured_image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">🎟️</span>
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center">
            <span className="text-xs font-bold text-white/70 bg-zinc-900/60 px-2 py-1 rounded uppercase tracking-wide">Past</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-zinc-900 text-sm leading-snug line-clamp-2 mb-2">{event.title}</h3>
        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
          <Calendar className="w-3 h-3 text-indigo-400" /> {dateStr}
        </p>
        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-indigo-400" /> {venue}
        </p>
        {active && event.slug && (
          <div className="mt-3 pt-3 border-t border-[#E8EBE7]">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all">
              Book Tickets →
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (active && event.slug) {
    return (
      <Link href={`/events/${event.slug}`}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
