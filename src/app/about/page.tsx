import { ArrowRight, ShieldCheck, Heart, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "About OakTix",
  description: "Learn about OakTix, Nigeria's modern ticketing platform.",
  openGraph: {
    title: "About OakTix",
    description: "Learn about OakTix, Nigeria's modern ticketing platform.",
    images: [{ url: "/logo-header.png", width: 1200, height: 630, alt: "OakTix" }],
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL
  },
  twitter: {
    card: "summary_large_image",
    title: "About OakTix",
    description: "Learn about OakTix, Nigeria's modern ticketing platform.",
    images: ["/logo-header.png"]
  }
});

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full pt-32 pb-24 px-6 relative space-y-20">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-indigo-500 tracking-tight leading-tight">
            Tickets for the moments that matter most.
          </h1>
          <p className="text-zinc-600 text-base md:text-lg leading-relaxed">
            OakTix is Nigeria&apos;s modern ticketing platform, built so that organizers can sell with confidence and fans can walk into the experiences they love with nothing more than a phone in their pocket.
          </p>
        </div>

        {/* Our Story */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-[#E8EBE7] dark:border-white/10 items-start">
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-indigo-500 tracking-wider">Our Story</h3>
            <h2 className="text-2xl font-bold font-heading text-zinc-800 dark:text-zinc-100">Why we started OakTix</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Nigerian events are world-class. However, for too long, the tools to sell tickets have been clunky, expensive, or imported from markets that don&apos;t understand us. We started OakTix to change that.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              From a small team in Ibadan, we set out to build a platform that respects both sides of every ticket: the organizer pouring months of work into a single night, and the fan saving up to be there.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-indigo-500 tracking-wider">Our Mission</h3>
            <h2 className="text-2xl font-bold font-heading text-zinc-800 dark:text-zinc-100">What drives us forward</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Make it effortless to discover, sell and attend live events across Africa. We obsess over speed, fairness, and the small details that turn a ticket purchase into the start of a great night out.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Whether it&apos;s 50 seats at a community workshop or 50,000 at a stadium show, the experience should feel just as smooth.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="space-y-10 pt-8 border-t border-[#E8EBE7] dark:border-white/10">
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-3xl font-bold font-heading text-zinc-900 dark:text-white tracking-tight">What we stand for</h2>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mt-1.5">Core principles of our service</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 bg-white border-[#E8EBE7] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Built for culture</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">
                From Afrobeats concerts in Lagos to tech summits in Abuja, we celebrate the events that shape Nigeria.
              </p>
            </div>

            <div className="glass-card p-6 bg-white border-[#E8EBE7] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Trust by default</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Secure Transactpay checkout, fraud-resistant QR tickets, and verified vendors keep every transaction safe.
              </p>
            </div>

            <div className="glass-card p-6 bg-white border-[#E8EBE7] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Vendor-first</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Fair fees, fast payouts, and tools that put organizers in control of their events and audience.
              </p>
            </div>

            <div className="glass-card p-6 bg-white border-[#E8EBE7] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Made in Nigeria</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Built for the Nigerian market with Naira pricing, local banks, and support that understands you.
              </p>
            </div>
          </div>
        </div>

        {/* Banner CTA */}
        <div className="rounded-3xl bg-indigo-500 text-white p-8 md:p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold font-heading">Ready to host your next event?</h2>
          <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed">
            Join the vendors using OakTix to fill rooms, stadiums and everything in between.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/signup" 
              className="px-6 py-3 rounded-xl bg-white text-indigo-900 hover:bg-zinc-100 font-bold text-sm transition-all"
            >
              List your event
            </Link>
            <Link 
              href="/events" 
              className="px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 font-bold text-sm transition-all flex items-center gap-1.5"
            >
              Browse events <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
