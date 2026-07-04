"use client";

import Link from "next/link";

interface FooterProps {
  theme?: "light" | "dark";
}

export default function Footer({ theme = "light" }: FooterProps) {
  const isDark = theme === "dark";

  return (
    <footer
      className="border-t py-16 transition-all duration-300 border-[#E8EBE7] dark:border-zinc-800/80 bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white"
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2 space-y-6">
          <Link href="/" className="flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-footer.png"
              alt="OakTix"
              className="h-16 w-auto object-contain"
            />
          </Link>
          <p className="text-xs leading-relaxed max-w-sm text-zinc-500 dark:text-zinc-400">
            Nigeria&apos;s home for unforgettable events. Discover concerts, conferences, festivals and more. Buy tickets in seconds, walk in with a QR code.
          </p>
          <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
            Support:{" "}
            <a href="mailto:hello@oaktix.com.ng" className="text-indigo-500 hover:underline">
              hello@oaktix.com.ng
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-zinc-800 dark:text-zinc-300">
            Discover
          </h4>
          <ul className="space-y-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
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
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-zinc-800 dark:text-zinc-300">
            Sell
          </h4>
          <ul className="space-y-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
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
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-zinc-800 dark:text-zinc-300">
            Company
          </h4>
          <ul className="space-y-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
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

      <div className="max-w-6xl mx-auto px-6 pt-12 mt-12 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-wider border-[#E8EBE7] dark:border-zinc-800/80 text-zinc-500">
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
