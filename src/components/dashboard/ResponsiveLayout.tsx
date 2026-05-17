"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X, Ticket } from "lucide-react";
import Link from "next/link";

interface ResponsiveLayoutProps {
  role: "user" | "vendor" | "admin" | "super_admin" | "staff";
  children: React.ReactNode;
}

export default function ResponsiveLayout({ role, children }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FAF9F6] overflow-hidden relative">
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
          <div className="relative flex w-full max-w-xs flex-col bg-white h-full animate-slide-in shadow-2xl">
            {/* Close Button Inside Drawer */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-650"
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
        <header className="lg:hidden w-full h-16 bg-white border-b border-[#E8EBE7] flex items-center justify-between px-6 shrink-0 z-30">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Ticket className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-bold font-heading tracking-tight flex items-center">
              <span className="text-indigo-500">Oak</span>
              <span className="text-amber-500">Tix</span>
            </span>
          </Link>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-zinc-50 text-zinc-800 border border-[#E8EBE7] transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Children Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[#FAF9F6] text-[#1A1A1A]">
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
