import { Users, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Vendors – OakTix",
  description: "Explore event vendors and organizers on OakTix.",
  openGraph: {
    title: "Vendors – OakTix",
    description: "Explore event vendors and organizers on OakTix.",
    images: [{ url: "/logo-header.png", width: 1200, height: 630, alt: "OakTix" }],
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendors – OakTix",
    description: "Explore event vendors and organizers on OakTix.",
    images: ["/logo-header.png"]
  }
});
import Link from "next/link";

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch organizers from db
  const { data: dbVendors } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("role", "vendor");

  // Fallbacks exactly matching reference copy
  const fallbackVendors = [
    {
      id: "oaktix-live",
      full_name: "OakTix Live",
      description: "Official OakTix curator of top-tier concerts and festivals.",
      events_count: 3,
      followers_count: 0
    },
    {
      id: "triad-party",
      full_name: "Triad Party",
      description: "Making Ibadan nightlife memorable.",
      events_count: 1,
      followers_count: 0
    }
  ];

  const vendors = dbVendors && dbVendors.length > 0
    ? dbVendors.map((v) => ({
        id: v.id,
        full_name: v.full_name || "Organiser",
        description: "Passionate creator of immersive live events and cultural gatherings.",
        events_count: 2,
        followers_count: 0
      }))
    : fallbackVendors;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full pt-32 pb-24 px-6 relative">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-indigo-500 tracking-tight">Event organisers</h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">Discover the creators behind Nigeria&apos;s best events.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vendors.map((vendor) => (
            <div 
              key={vendor.id}
              className="glass-card p-6 bg-white border-[#E8EBE7] flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/5"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-500 text-lg">
                    {vendor.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-zinc-800">{vendor.full_name}</h3>
                    <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {vendor.events_count} Events</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {vendor.followers_count} Followers</span>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">{vendor.description}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E8EBE7] flex justify-end">
                <Link 
                  href={`/events?vendor=${vendor.id}`}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
