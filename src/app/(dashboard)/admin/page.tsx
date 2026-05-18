import { ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLoginPortal from "@/components/admin/AdminLoginPortal";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in at all, render the dedicated admin login portal
  if (!user) {
    return <AdminLoginPortal />;
  }

  // Fetch role from the database profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || user.user_metadata?.role;

  // Protect against non-admin sessions trying to access admin panel
  if (userRole !== "admin" && userRole !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center gap-3">
            Super Admin Console
            {userRole === "super_admin" && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold uppercase tracking-wider">
                Super Admin
              </span>
            )}
          </h1>
          <p className="text-zinc-500">Platform-wide oversight, administrative actions, and user role configuration.</p>
        </div>

        {userRole === "super_admin" && (
          <Link
            href="/admin/users"
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Assign User Roles
          </Link>
        )}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 bg-gray-900/40 border border-gray-800 shadow-sm">
           <p className="text-sm text-zinc-400 mb-1">Total Platform GMV</p>
           <p className="text-2xl font-bold font-heading text-indigo-300">₦0.00</p>
           <div className="mt-2 text-xs text-indigo-300 font-bold">Platform Fee (4%): ₦0.00</div>
        </div>
        <div className="glass-card p-6 bg-gray-900/40 border border-gray-800 shadow-sm">
           <p className="text-sm text-zinc-400 mb-1">Total Users</p>
           <p className="text-2xl font-bold font-heading text-white">1</p>
           <div className="mt-2 text-xs text-zinc-400">Active now: 1</div>
        </div>
        <div className="glass-card p-6 bg-gray-900/40 border border-gray-800 shadow-sm">
           <p className="text-sm text-zinc-400 mb-1">Active Vendors</p>
          <p className="text-2xl font-bold font-heading">0</p>
           <div className="mt-2 text-xs text-amber-400 font-bold">0 Pending verification</div>
        </div>
        <div className="glass-card p-6 bg-gray-900/40 border border-gray-800 shadow-sm">
          <p className="text-sm text-zinc-500 mb-1">Live Events</p>
          <p className="text-2xl font-bold font-heading">0</p>
          <div className="mt-2 text-xs text-zinc-500">Tickets sold today: 0</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification Queue */}
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

        {/* Flagged / Reported Content */}
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
