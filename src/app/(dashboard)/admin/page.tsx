"use client";

import { ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLoginPortal from "@/components/admin/AdminLoginPortal";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: 'Admin Dashboard – OakTix',
  description: 'Super admin console for monitoring platform health and managing vendors.',
  openGraph: {
    title: 'Admin Dashboard – OakTix',
    description: 'Super admin console for monitoring platform health and managing vendors.',
    images: [{ url: '/logo-header.png', width: 1200, height: 630, alt: 'OakTix' }],
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin Dashboard – OakTix',
    description: 'Super admin console for monitoring platform health and managing vendors.',
    images: ['/logo-header.png'],
  },
});

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUser(null);
      setLoading(false);
      return;
    }
    setUser(user);
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();
    const userRole = profile?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      router.replace('/dashboard');
      return;
    }
    // Dashboard stats: ensure we get a single object
    const { data } = await supabase.rpc('dashboard_stats');
    const statsObj = Array.isArray(data) ? data[0] : data;
    setStats(statsObj);
    setLoading(false);
  };
  fetchUser();
}, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginPortal />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-muted)] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center gap-3">
            Super Admin Console
            {user?.user_metadata?.role === "super_admin" && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-bold uppercase tracking-wider">
                Super Admin
              </span>
            )}
          </h1>
          <p className="text-[var(--color-muted)]">
            Inspect order references, examine fee allocations, review payout splits, and monitor overall GMV growth.
          </p>
        </div>
        {user?.user_metadata?.role === "super_admin" && (
          <Link
            href="/admin/users"
            className="px-5 py-2.5 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-bg)] rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Assign User Roles
          </Link>
        )}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border border-[var(--color-muted)] shadow-sm">
          <p className="text-sm text-[var(--color-muted)] mb-1">Total Platform GMV</p>
          <p className="text-2xl font-bold font-heading text-[var(--color-primary)]">
            ₦{(stats?.gmv || 0).toLocaleString()}
          </p>
          <div className="mt-2 text-xs text-[var(--color-primary)] font-bold">
            Platform Fee: ₦{(stats?.platform_fee || 0).toLocaleString()}
          </div>
        </div>
        <div className="glass-card p-6 border border-[var(--color-muted)] shadow-sm">
          <p className="text-sm text-[var(--color-muted)] mb-1">Total Users</p>
          <p className="text-2xl font-bold font-heading text-[var(--color-text)]">
            {stats?.total_users || 0}
          </p>
          <div className="mt-2 text-xs text-[var(--color-muted)]">
            Registered accounts
          </div>
        </div>
        <div className="glass-card p-6 border border-[var(--color-muted)] shadow-sm">
          <p className="text-sm text-[var(--color-muted)] mb-1">Total Events</p>
          <p className="text-2xl font-bold font-heading text-[var(--color-text)]">
            {stats?.total_events || 0}
          </p>
          <div className="mt-2 text-xs text-[var(--color-muted)]">
            All events created
          </div>
        </div>
        <div className="glass-card p-6 border border-[var(--color-muted)] shadow-sm">
          <p className="text-sm text-[var(--color-muted)] mb-1">Active Vendors</p>
          <p className="text-2xl font-bold font-heading text-[var(--color-accent)]">
            {stats?.total_vendors || 0}
          </p>
          {/* No pending verification data */}
        </div>
        <div className="glass-card p-6 border border-[var(--color-muted)] shadow-sm">
          <p className="text-sm text-[var(--color-muted)] mb-1">Live Events</p>
          <p className="text-2xl font-bold font-heading text-[var(--color-text)]">
            {stats?.live_events || 0}
          </p>
          <div className="mt-2 text-xs text-[var(--color-muted)]">
            Active public events
          </div>
        </div>
      </div>

      /* Debug block removed */

      {/* Verification Queue & Moderation Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> Vendor Verifications
            </h2>
            <Link href="/admin/vendors" className="text-sm text-indigo-500 font-bold hover:text-indigo-600">
              Manage Queue
            </Link>
          </div>
          <div className="glass-card p-8 text-center text-zinc-400 bg-gray-900/40 border border-gray-800 shadow-sm">
            <p className="text-sm">No pending verification requests.</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Moderation Alerts
            </h2>
          </div>
          <div className="glass-card p-8 text-center text-zinc-400 border border-gray-800 shadow-sm">
            <p className="text-sm">No flagged events or reviews.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
