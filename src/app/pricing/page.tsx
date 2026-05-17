import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full pt-32 pb-24 px-6 relative">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-indigo-500 tracking-tight">Simple, transparent fees</h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">No setup fees, no monthly costs. We only make money when you do.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free */}
          <div className="glass-card p-8 bg-white border-[#E8EBE7] flex flex-col justify-between hover:shadow-md hover:shadow-indigo-500/5 transition-all">
            <div>
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">For free events</span>
              <h3 className="text-2xl font-bold font-heading text-zinc-800 mt-2">Free</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold text-indigo-500">₦0</span>
                <span className="text-xs text-zinc-400 font-bold uppercase ml-1">/ ticket</span>
              </div>
              <hr className="border-t border-[#E8EBE7] my-4" />
              <ul className="space-y-3.5 text-xs text-zinc-500 font-bold">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Free events only</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Unlimited tickets</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Instant QR delivery</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Basic analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Check-in app</li>
              </ul>
            </div>

            <Link 
              href="/signup" 
              className="mt-8 w-full py-3.5 rounded-xl border border-indigo-500/20 text-indigo-500 text-center font-bold text-sm hover:bg-indigo-500/5 transition-colors"
            >
              Start for free
            </Link>
          </div>

          {/* Standard */}
          <div className="glass-card p-8 bg-white border-2 border-indigo-500 relative flex flex-col justify-between hover:shadow-md hover:shadow-indigo-500/5 transition-all">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              Most Popular
            </span>
            <div>
              <span className="text-xs uppercase font-bold text-indigo-500 tracking-wider">For paid events</span>
              <h3 className="text-2xl font-bold font-heading text-zinc-800 mt-2">Standard</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold text-indigo-500">4%</span>
                <span className="text-xs text-zinc-400 font-bold uppercase ml-1">/ ticket sold</span>
              </div>
              <hr className="border-t border-[#E8EBE7] my-4" />
              <ul className="space-y-3.5 text-xs text-zinc-500 font-bold">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Up to ₦2,000 max fee per ticket</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Paystack checkout integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> 24h automatic payouts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Advanced sales analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Organizer app & scanner</li>
              </ul>
            </div>

            <Link 
              href="/signup" 
              className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-center font-bold text-sm transition-all shadow-md shadow-amber-500/10"
            >
              List your event
            </Link>
          </div>

          {/* Enterprise */}
          <div className="glass-card p-8 bg-white border-[#E8EBE7] flex flex-col justify-between hover:shadow-md hover:shadow-indigo-500/5 transition-all">
            <div>
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">For high-volume ticket sellers</span>
              <h3 className="text-2xl font-bold font-heading text-zinc-800 mt-2">Enterprise</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold text-indigo-500">Custom</span>
              </div>
              <hr className="border-t border-[#E8EBE7] my-4" />
              <ul className="space-y-3.5 text-xs text-zinc-500 font-bold">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Lower commission rates</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Dedicated account support</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Custom white-label branding</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Advanced API & webhook access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> On-site check-in support</li>
              </ul>
            </div>

            <Link 
              href="/contact" 
              className="mt-8 w-full py-3.5 rounded-xl border border-indigo-500/20 text-indigo-500 text-center font-bold text-sm hover:bg-indigo-500/5 transition-colors"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
