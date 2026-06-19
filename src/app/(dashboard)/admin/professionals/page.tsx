import { Suspense } from "react";
import Link from "next/link";
import { BadgeCheck, Flame, Users, CheckCircle, Clock, XCircle, Ban, ExternalLink } from "lucide-react";
import { getAllProfessionalsAdmin } from "@/lib/professionals/queries";
import AdminProfessionalsClient from "@/components/professionals/AdminProfessionalsClient";

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminProfessionalsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const professionals = await getAllProfessionalsAdmin({
    status: sp.status || "all",
    search: sp.search,
  });

  const counts = {
    all: professionals.length,
    pending: professionals.filter((p) => p.status === "pending").length,
    approved: professionals.filter((p) => p.status === "approved").length,
    rejected: professionals.filter((p) => p.status === "rejected").length,
    suspended: professionals.filter((p) => p.status === "suspended").length,
  };

  // Filter client-side based on status param
  const filtered = sp.status && sp.status !== "all"
    ? professionals.filter((p) => p.status === sp.status)
    : professionals;

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white">Professionals</h1>
          <p className="text-zinc-500 text-sm mt-1">{counts.all} total professionals on the platform</p>
        </div>
        <Link
          href="/admin/professionals/categories"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          Manage Categories
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { key: "all", label: "All", count: counts.all, icon: <Users className="w-3.5 h-3.5" /> },
          { key: "pending", label: "Pending", count: counts.pending, icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
          { key: "approved", label: "Approved", count: counts.approved, icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> },
          { key: "rejected", label: "Rejected", count: counts.rejected, icon: <XCircle className="w-3.5 h-3.5 text-red-500" /> },
          { key: "suspended", label: "Suspended", count: counts.suspended, icon: <Ban className="w-3.5 h-3.5 text-zinc-400" /> },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/professionals?status=${tab.key}`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              (sp.status ?? "all") === tab.key
                ? "bg-indigo-500 text-white border-indigo-500"
                : "bg-white dark:bg-zinc-900 border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500/30"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${(sp.status ?? "all") === tab.key ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Professionals list */}
      <Suspense>
        <AdminProfessionalsClient professionals={filtered} />
      </Suspense>
    </div>
  );
}
