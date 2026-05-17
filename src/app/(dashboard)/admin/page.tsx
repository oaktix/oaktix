import { ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Super Admin Console
        </h1>
        <p className="text-zinc-500">Platform-wide oversight and management.</p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-indigo-500/10">
          <p className="text-sm text-zinc-500 mb-1">Total Platform GMV</p>
          <p className="text-2xl font-bold font-heading">₦0.00</p>
          <div className="mt-2 text-xs text-indigo-400 font-bold">Platform Fee (4%): ₦0.00</div>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-zinc-500 mb-1">Total Users</p>
          <p className="text-2xl font-bold font-heading">1</p>
          <div className="mt-2 text-xs text-zinc-500">Active now: 1</div>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-zinc-500 mb-1">Active Vendors</p>
          <p className="text-2xl font-bold font-heading">0</p>
          <div className="mt-2 text-xs text-amber-500 font-bold">0 Pending verification</div>
        </div>
        <div className="glass-card p-6">
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
            <Link href="/admin/vendors" className="text-sm text-indigo-400 font-bold hover:text-indigo-300">
              Manage Queue
            </Link>
          </div>
          <div className="glass-card p-8 text-center text-zinc-500">
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
          <div className="glass-card p-8 text-center text-zinc-500 border-rose-500/5">
            <p className="text-sm">No flagged events or reviews.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
