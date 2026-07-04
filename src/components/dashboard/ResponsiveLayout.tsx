"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import Link from "next/link";

interface ResponsiveLayoutProps {
  role: "user" | "vendor" | "admin" | "super_admin" | "staff";
  children: React.ReactNode;
}

export default function ResponsiveLayout({ role, children }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FAF9F6] dark:bg-zinc-950 overflow-hidden relative">
      {/* Desktop Sidebar (hidden on mobile, visible on lg) */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar role={role} />
      </div>

      {/* Mobile Drawer Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sliding Content Container */}
          <div className="relative flex w-full max-w-xs flex-col bg-white dark:bg-zinc-950 h-full animate-slide-in shadow-2xl">
            {/* Close Button Inside Drawer */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="h-full overflow-y-auto">
              <Sidebar role={role} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header Bar (hidden on desktop) */}
        <header className="lg:hidden w-full h-16 bg-white dark:bg-zinc-950 border-b border-[#E8EBE7] dark:border-white/5 flex items-center justify-between px-6 shrink-0 z-30 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-orange-500 to-green-500 dark:hidden" />
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-header.png"
              alt="OakTix"
              className="h-7 w-auto object-contain"
            />
          </Link>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-[#E8EBE7] dark:border-white/10 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Children Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[#FAF9F6] dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-orange-500 to-green-500 dark:hidden hidden lg:block" />
          {/* Ambient glow background */}
          <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-600/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
