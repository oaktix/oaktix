import { Mail, Phone, MapPin, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Contact OakTix",
  description: "Get in touch with OakTix support and sales.",
  openGraph: {
    title: "Contact OakTix",
    description: "Get in touch with OakTix support and sales.",
    images: [{ url: "/logo-header.png", width: 1200, height: 630, alt: "OakTix" }],
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact OakTix",
    description: "Get in touch with OakTix support and sales.",
    images: ["/logo-header.png"]
  }
});

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full pt-32 pb-24 px-6 relative">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-indigo-500 tracking-tight">Get in touch</h1>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">Have questions? We are here to help.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          {/* Details */}
          <div className="md:col-span-2 space-y-8">
            <h3 className="text-xs uppercase font-bold text-zinc-400 tracking-widest">Contact Information</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-800">Email Address</h4>
                  <a href="mailto:hello@oaktix.com.ng" className="text-indigo-500 text-sm font-bold hover:underline">hello@oaktix.com.ng</a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-800">Phone Support</h4>
                  <a href="tel:+2349071008912" className="text-indigo-500 text-sm font-bold hover:underline">+234 907 100 8912</a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-800">Office Location</h4>
                  <p className="text-zinc-500 text-sm font-bold">Ibadan, Nigeria</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E8EBE7] space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Official Channels</h4>
              <div className="flex gap-4 text-xs font-bold text-zinc-500">
                <span className="hover:text-indigo-500 cursor-pointer">Instagram (@oaktix)</span>
                <span className="hover:text-indigo-500 cursor-pointer">TikTok (@oaktix)</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3 glass-card p-8 bg-white border-[#E8EBE7]">
            <form className="space-y-5">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Full name</label>
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  className="w-full mt-1.5 bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Email address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  className="w-full mt-1.5 bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Subject</label>
                <input 
                  type="text" 
                  placeholder="How can we help?" 
                  className="w-full mt-1.5 bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Message</label>
                <textarea 
                  rows={5} 
                  placeholder="Write your message details..." 
                  className="w-full mt-1.5 bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm placeholder:text-zinc-400"
                />
              </div>

              <button 
                type="button" 
                className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
