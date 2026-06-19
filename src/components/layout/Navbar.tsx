"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket, Menu, X, ChevronRight, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavbarProps {
  theme?: "light" | "dark" | "transparent";
  user?: { id: string; email?: string } | null;
}

export default function Navbar({ theme = "light", user = null }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const isDark = theme === "dark";
  const isTransparent = theme === "transparent";

  return (
    <header className="relative w-full">
      {/* Main Nav Container */}
      <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
          isTransparent
            ? "bg-transparent border-white/10 text-white"
            : "bg-[#FAF9F6]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-[#E8EBE7] dark:border-zinc-800/80 text-zinc-900 dark:text-white"
        } px-6 py-4 flex items-center justify-between`}
      >
        <Link href="/" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-header.png"
            alt="OakTix"
            className="h-8 w-auto group-hover:scale-[1.02] transition-transform object-contain"
          />
        </Link>

        {/* Desktop Links */}
        <div
          className={`hidden md:flex items-center gap-8 text-sm font-bold ${
            isTransparent ? "text-zinc-200" : "text-zinc-600 dark:text-zinc-200"
          }`}
        >
          <Link href="/events" className={`hover:text-indigo-500 transition-colors`}>
            Browse Events
          </Link>
          <Link href="/professionals" className={`hover:text-indigo-500 transition-colors`}>
            Professionals
          </Link>
          <Link href="/categories" className={`hover:text-indigo-500 transition-colors`}>
            Categories
          </Link>
          <Link href="/vendors" className={`hover:text-indigo-500 transition-colors`}>
            Organisers
          </Link>
          <Link href="/about" className={`hover:text-indigo-500 transition-colors`}>
            About
          </Link>
          <Link href="/contact" className={`hover:text-indigo-500 transition-colors`}>
            Contact
          </Link>
        </div>

        {/* Desktop CTA / Auth */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/organizer/events"
              className={`text-sm font-bold flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-indigo-500 dark:hover:text-white transition-colors`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className={`text-sm font-bold flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-white transition-colors`}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-bold transition-colors text-zinc-650 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-white`}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold transition-all shadow-md shadow-amber-500/10"
              >
                List your event
              </Link>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-4">
          {!user && (
            <Link
              href="/signup"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all"
            >
              List Event
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className={`p-2 rounded-lg transition-colors ${
              isTransparent ? "hover:bg-white/5 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-950 dark:text-zinc-100"
            }`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

        {/* Content Side Drawer */}
        <div
          className={`absolute right-0 top-0 h-full w-4/5 max-w-sm p-8 shadow-2xl transition-transform duration-300 flex flex-col justify-between ${
            isTransparent ? "bg-[#09090b] text-white" : "bg-[#FAF9F6] dark:bg-[#09090b] text-zinc-900 dark:text-white"
          } ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="space-y-8 mt-12">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-header.png"
                alt="OakTix"
                className="h-7 w-auto object-contain"
              />
            </Link>

            {/* Navigation links */}
            <div className="flex flex-col gap-6 text-base font-bold">
              <Link
                href="/events"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between hover:text-indigo-500 transition-colors"
              >
                Browse Events <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link
                href="/professionals"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between hover:text-indigo-500 transition-colors"
              >
                Professionals <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link
                href="/categories"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between hover:text-indigo-500 transition-colors"
              >
                Categories <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link
                href="/vendors"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between hover:text-indigo-500 transition-colors"
              >
                Organisers <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between hover:text-indigo-500 transition-colors"
              >
                About <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between hover:text-indigo-500 transition-colors"
              >
                Contact <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
            </div>
          </div>

          {/* Bottom actions inside drawer */}
          <div className="space-y-4 pt-6 border-t border-zinc-200/50">
            {user ? (
              <>
                <Link
                  href="/organizer/events"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-center block transition-all shadow-md shadow-indigo-600/20"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className={`w-full py-3.5 rounded-xl border font-bold text-center block transition-all border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className={`w-full py-3.5 rounded-xl border font-bold text-center block transition-all border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5`}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-center block transition-all shadow-md shadow-indigo-600/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
