"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Ticket, 
  Calendar, 
  Heart, 
  Settings, 
  LogOut, 
  PlusCircle, 
  Users, 
  BarChart3, 
  Wallet,
  ShieldCheck,
  Ticket as TicketIcon,
  Mail,
  Banknote,
  Tag
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  role: 'user' | 'vendor' | 'admin' | 'super_admin' | 'staff';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = {
    user: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "My Tickets", href: "/dashboard/tickets", icon: Ticket },
      { name: "Saved Events", href: "/dashboard/saved", icon: Heart },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    vendor: [
      { name: "Overview", href: "/organizer", icon: LayoutDashboard },
      { name: "My Events", href: "/organizer/events", icon: Calendar },
      { name: "Scan Tickets", href: "/scan", icon: TicketIcon },
      { name: "Attendees", href: "/organizer/attendees", icon: Users },
      { name: "Team Access", href: "/organizer/team", icon: Users },
      { name: "Analytics", href: "/organizer/analytics", icon: BarChart3 },
      { name: "Communications", href: "/organizer/communications", icon: Mail },
      { name: "Coupons", href: "/organizer/coupons", icon: Tag },
      { name: "Financials", href: "/organizer/finances", icon: Wallet },
      { name: "Settings", href: "/organizer/settings", icon: Settings },
    ],
    admin: [
      { name: "Platform Health", href: "/admin", icon: LayoutDashboard },
      { name: "Vendors", href: "/admin/vendors", icon: ShieldCheck },
      { name: "Events", href: "/admin/events", icon: Calendar },
      { name: "Transactions", href: "/admin/transactions", icon: Wallet },
      { name: "Withdrawals", href: "/admin/withdrawals", icon: Banknote },
      { name: "Coupons", href: "/admin/coupons", icon: Tag },
      { name: "System", href: "/admin/system", icon: Settings },
    ],
    super_admin: [
      { name: "Platform Health", href: "/admin", icon: LayoutDashboard },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Vendors", href: "/admin/vendors", icon: ShieldCheck },
      { name: "Events", href: "/admin/events", icon: Calendar },
      { name: "Transactions", href: "/admin/transactions", icon: Wallet },
      { name: "Withdrawals", href: "/admin/withdrawals", icon: Banknote },
      { name: "Coupons", href: "/admin/coupons", icon: Tag },
      { name: "System", href: "/admin/system", icon: Settings },
    ],
    staff: [
      { name: "Scan Tickets", href: "/scan", icon: TicketIcon },
    ],
  };

  const items = navItems[role] || navItems.user;

  return (
    <div className="w-full lg:w-64 h-full flex flex-col p-6 bg-white dark:bg-zinc-950 border-r border-[#E8EBE7] dark:border-white/5 relative">
      {/* Subtle accent strip on the left for desktop (optional, keeping the dashboard top strip only per previous change, but let's add a small detail) */}
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-black via-orange-500 to-green-500 dark:hidden hidden lg:block" />
      <div className="flex items-center mb-10 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-header.png"
          alt="OakTix"
          className="h-8 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold" 
                  : "text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 font-medium"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {role === 'vendor' && (
        <Link 
          href="/organizer/events/new"
          className="mb-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/10"
        >
          <PlusCircle className="w-5 h-5" />
          Create Event
        </Link>
      )}

      <div className="mt-auto border-t border-[#E8EBE7] dark:border-white/5 pt-6">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-500/10 transition-all group font-medium"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
