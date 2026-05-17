"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";

interface FooterProps {
  theme?: "light" | "dark";
}

export default function Footer({ theme = "light" }: FooterProps) {
  const isDark = theme === "dark";

  return (
    <footer
      className={`border-t py-16 transition-all duration-300 ${
        isDark
          ? "border-zinc-800/80 bg-[#09090b] text-white"
          : "border-[#E8EBE7] bg-white text-zinc-900"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2 space-y-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Ticket className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl font-bold font-heading tracking-tight flex items-center">
              <span className="text-indigo-500">Oak</span>
              <span className="text-amber-500">Tix</span>
            </span>
          </Link>
          <p className={`text-xs leading-relaxed max-w-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Nigeria&apos;s home for unforgettable events. Discover concerts, conferences, festivals and more — buy tickets in seconds, walk in with a QR code.
          </p>
          <div className={`text-xs font-bold ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
            Support:{" "}
            <a href="mailto:hello@oaktix.com.ng" className="text-indigo-500 hover:underline">
              hello@oaktix.com.ng
            </a>
          </div>
        </div>

        <div>
          <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
            Discover
          </h4>
          <ul className={`space-y-2.5 text-xs font-bold ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            <li>
              <Link href="/events" className="hover:text-indigo-500 transition-colors">
                Browse events
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-indigo-500 transition-colors">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/vendors" className="hover:text-indigo-500 transition-colors">
                Organisers
              </Link>
            </li>
            <li>
              <Link href="/events?featured=1" className="hover:text-indigo-500 transition-colors">
                Featured
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
            Sell
          </h4>
          <ul className={`space-y-2.5 text-xs font-bold ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            <li>
              <Link href="/signup" className="hover:text-indigo-500 transition-colors">
                List your event
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-indigo-500 transition-colors">
                Organiser login
              </Link>
            </li>
            <li>
              <Link href="/scan" className="hover:text-indigo-500 transition-colors">
                Staff scanner
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-indigo-500 transition-colors">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
            Company
          </h4>
          <ul className={`space-y-2.5 text-xs font-bold ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            <li>
              <Link href="/about" className="hover:text-indigo-500 transition-colors">
                About OakTix
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-indigo-500 transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-indigo-500 transition-colors">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-indigo-500 transition-colors">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className={`max-w-6xl mx-auto px-6 pt-12 mt-12 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-wider ${
        isDark ? "border-zinc-800/80 text-zinc-500" : "border-[#E8EBE7] text-zinc-450"
      }`}>
        <p>© 2026 OakTix. All rights reserved.</p>
        <div className="flex gap-4">
          <span className="hover:text-indigo-500 cursor-pointer">Instagram</span>
          <span className="hover:text-indigo-500 cursor-pointer">Twitter</span>
          <span className="hover:text-indigo-500 cursor-pointer">TikTok</span>
        </div>
      </div>
    </footer>
  );
}
