"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck, Flame, Star, MapPin, Check, X, Ban, ExternalLink, Search, ChevronDown, Pencil,
} from "lucide-react";
import {
  approveProfessional,
  rejectProfessional,
  suspendProfessional,
  toggleProfessionalFeatured,
  toggleProfessionalVerified,
} from "@/lib/professionals/actions";
import type { Professional } from "@/lib/professionals/types";
import { useRouter } from "next/navigation";

interface AdminProfessionalsClientProps {
  professionals: Professional[];
}

export default function AdminProfessionalsClient({ professionals }: AdminProfessionalsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = professionals.filter(
    (p) =>
      !search ||
      p.professional_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const action = async (fn: () => Promise<{ success: boolean; error?: string }>, id: string) => {
    setLoadingId(id);
    const result = await fn();
    setLoadingId(null);
    if (!result.success) {
      alert(result.error ?? "Action failed.");
    } else {
      router.refresh();
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await action(() => rejectProfessional(rejectModal.id, rejectReason), rejectModal.id);
    setRejectModal(null);
    setRejectReason("");
  };

  const statusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-600 border border-red-500/20",
      suspended: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
    };
    return cfg[status] ?? "bg-zinc-100 text-zinc-600";
  };

  return (
    <>
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, city..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No professionals found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="glass-card p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Photo */}
                <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {p.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.profile_photo} alt={p.professional_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">{p.category?.icon ?? "🎯"}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-white">{p.professional_name}</span>
                    {p.verified && <BadgeCheck className="w-4 h-4 text-indigo-500" />}
                    {p.featured && <Flame className="w-4 h-4 text-amber-500" />}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-400">
                    <span>{p.category?.name}</span>
                    {p.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.city}, {p.state}</span>}
                    {p.email && <span>{p.email}</span>}
                    {p.total_reviews > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {p.average_rating.toFixed(1)} ({p.total_reviews})
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/professionals/${p.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500/30 hover:text-indigo-600 text-xs font-bold transition-all"
                    title="Edit professional"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <Link
                    href={`/professionals/${p.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg border border-[#E8EBE7] dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                    title="View profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                  </Link>

                  {/* Approve */}
                  {p.status !== "approved" && (
                    <button
                      onClick={() => action(() => approveProfessional(p.id), p.id)}
                      disabled={loadingId === p.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-60"
                      title="Approve"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}

                  {/* Reject */}
                  {p.status === "pending" && (
                    <button
                      onClick={() => setRejectModal({ id: p.id, name: p.professional_name })}
                      disabled={loadingId === p.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-60"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}

                  {/* Suspend */}
                  {p.status === "approved" && (
                    <button
                      onClick={() => action(() => suspendProfessional(p.id), p.id)}
                      disabled={loadingId === p.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold transition-all disabled:opacity-60"
                    >
                      <Ban className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}

                  {/* Toggle Featured */}
                  <button
                    onClick={() => action(() => toggleProfessionalFeatured(p.id, !p.featured), p.id)}
                    disabled={loadingId === p.id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                      p.featured
                        ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                        : "border border-[#E8EBE7] dark:border-white/10 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                    title={p.featured ? "Remove featured" : "Set featured"}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    {p.featured ? "Unfeature" : "Feature"}
                  </button>

                  {/* Toggle Verified */}
                  <button
                    onClick={() => action(() => toggleProfessionalVerified(p.id, !p.verified), p.id)}
                    disabled={loadingId === p.id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                      p.verified
                        ? "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                        : "border border-[#E8EBE7] dark:border-white/10 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                    title={p.verified ? "Remove verification" : "Verify"}
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {p.verified ? "Unverify" : "Verify"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E8EBE7] dark:border-white/10">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Reject Application</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Rejecting <strong>{rejectModal.name}</strong>. Please provide a reason so they can improve their application.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (will be shown to the professional)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all disabled:opacity-40"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
