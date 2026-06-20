"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck, Flame, Star, MapPin, Save, Trash2, AlertCircle, CheckCircle,
  Image as ImageIcon, MessageSquare, Check, X, Ban, Loader2,
} from "lucide-react";
import {
  adminUpdateProfessional,
  adminDeleteProfessional,
  approveProfessional,
  rejectProfessional,
  suspendProfessional,
} from "@/lib/professionals/actions";
import type { Professional } from "@/lib/professionals/types";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

interface Props {
  professional: Professional;
  categories: Category[];
  portfolioCount: number;
  inquiryCount: number;
}

type Tab = "basic" | "contact" | "location" | "pricing" | "social" | "badges";

const TABS: { key: Tab; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "contact", label: "Contact" },
  { key: "location", label: "Location" },
  { key: "pricing", label: "Pricing" },
  { key: "social", label: "Social" },
  { key: "badges", label: "Badges" },
];

export default function AdminProfessionalEditClient({
  professional: initial,
  categories,
  portfolioCount,
  inquiryCount,
}: Props) {
  const router = useRouter();

  // Local form state — mirrors all editable columns
  const [form, setForm] = useState({
    professional_name: initial.professional_name ?? "",
    business_name: initial.business_name ?? "",
    headline: initial.headline ?? "",
    bio: initial.bio ?? "",
    years_of_experience: initial.years_of_experience ?? 0,
    category_id: initial.category_id ?? "",
    city: initial.city ?? "",
    state: initial.state ?? "",
    country: initial.country ?? "Nigeria",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    whatsapp: initial.whatsapp ?? "",
    website: initial.website ?? "",
    instagram: initial.instagram ?? "",
    facebook: initial.facebook ?? "",
    twitter: initial.twitter ?? "",
    linkedin: initial.linkedin ?? "",
    tiktok: initial.tiktok ?? "",
    youtube: initial.youtube ?? "",
    pricing_type: (initial.pricing_type ?? "negotiable") as "fixed" | "hourly" | "per_event" | "negotiable",
    starting_price: initial.starting_price ?? "",
    currency: initial.currency ?? "NGN",
    verified: initial.verified ?? false,
    featured: initial.featured ?? false,
    top_rated: initial.top_rated ?? false,
    most_booked: initial.most_booked ?? false,
    fast_responder: initial.fast_responder ?? false,
  });

  const [tab, setTab] = useState<Tab>("basic");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const f = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const statusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-600 border border-red-500/20",
      suspended: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
    };
    return cfg[status] ?? "bg-zinc-100 text-zinc-600";
  };

  const runAction = async (label: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setActionLoading(label);
    setError(null);
    const result = await fn();
    setActionLoading(null);
    if (!result.success) {
      setError(result.error ?? "Action failed");
    } else {
      setSuccess(label + " successful");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.professional_name.trim()) { setError("Professional name is required."); return; }
    setSaving(true);
    setError(null);
    const result = await adminUpdateProfessional(initial.id, {
      ...form,
      starting_price: form.starting_price !== "" ? Number(form.starting_price) : null,
      business_name: form.business_name || null,
      headline: form.headline || null,
      bio: form.bio || null,
      city: form.city || null,
      state: form.state || null,
      email: form.email || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      website: form.website || null,
      instagram: form.instagram || null,
      facebook: form.facebook || null,
      twitter: form.twitter || null,
      linkedin: form.linkedin || null,
      tiktok: form.tiktok || null,
      youtube: form.youtube || null,
      category_id: form.category_id || null,
    });
    setSaving(false);
    if (result.success) {
      setSuccess("Profile saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error ?? "Save failed.");
    }
  };

  const handleDelete = async () => {
    setActionLoading("delete");
    const result = await adminDeleteProfessional(initial.id);
    setActionLoading(null);
    if (result.success) {
      router.push("/admin/professionals");
    } else {
      setError(result.error ?? "Delete failed.");
      setShowDeleteConfirm(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  return (
    <>
      {/* Header card */}
      <div className="glass-card p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Photo */}
        <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {initial.profile_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={initial.profile_photo} alt={initial.professional_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {initial.category?.icon ?? "🎯"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-zinc-900 dark:text-white truncate">
              {initial.professional_name}
            </h1>
            {initial.verified && <BadgeCheck className="w-5 h-5 text-indigo-500" />}
            {initial.featured && <Flame className="w-5 h-5 text-amber-500" />}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusBadge(initial.status)}`}>
              {initial.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-400">
            <span>{initial.category?.name}</span>
            {initial.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{initial.city}, {initial.state}
              </span>
            )}
            {initial.total_reviews > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {initial.average_rating?.toFixed(1)} ({initial.total_reviews} reviews)
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-center flex-shrink-0">
          <div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-zinc-400" /> {portfolioCount}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Portfolio</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-zinc-400" /> {inquiryCount}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Inquiries</div>
          </div>
        </div>
      </div>

      {/* Status actions */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Status Controls</h2>
        <div className="flex flex-wrap gap-2">
          {initial.status !== "approved" && (
            <button
              onClick={() => runAction("Approved", () => approveProfessional(initial.id))}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-60"
            >
              {actionLoading === "Approved" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Approve
            </button>
          )}
          {initial.status === "pending" && (
            <button
              onClick={() => setRejectModal(true)}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-60"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          )}
          {initial.status === "approved" && (
            <button
              onClick={() => runAction("Suspended", () => suspendProfessional(initial.id))}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold transition-all disabled:opacity-60"
            >
              {actionLoading === "Suspended" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              Suspend
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!!actionLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold transition-all disabled:opacity-60 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Professional
          </button>
        </div>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSave} className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Edit Profile</h2>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[#E8EBE7] dark:border-white/10 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold transition-all rounded-t-lg ${
                tab === t.key
                  ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-b-2 border-indigo-500"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Basic Info */}
        {tab === "basic" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Professional Name *</label>
                <input type="text" value={form.professional_name} onChange={f("professional_name")} className={inputCls} required />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Business Name</label>
                <input type="text" value={form.business_name} onChange={f("business_name")} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Category</label>
                <select value={form.category_id} onChange={f("category_id")} className={inputCls}>
                  <option value="">— Select category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Years of Experience</label>
                <input type="number" min={0} max={50} value={form.years_of_experience} onChange={f("years_of_experience")} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Headline</label>
              <input type="text" value={form.headline} onChange={f("headline")} placeholder="One-line tagline…" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Bio</label>
              <textarea value={form.bio} onChange={f("bio")} rows={5} placeholder="Full professional bio…" className={`${inputCls} resize-none`} />
            </div>
          </div>
        )}

        {/* Tab: Contact */}
        {tab === "contact" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Email</label>
              <input type="email" value={form.email} onChange={f("email")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={f("phone")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">WhatsApp</label>
              <input type="tel" value={form.whatsapp} onChange={f("whatsapp")} className={inputCls} />
            </div>
          </div>
        )}

        {/* Tab: Location */}
        {tab === "location" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">City</label>
              <input type="text" value={form.city} onChange={f("city")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">State</label>
              <input type="text" value={form.state} onChange={f("state")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Country</label>
              <input type="text" value={form.country} onChange={f("country")} className={inputCls} />
            </div>
          </div>
        )}

        {/* Tab: Pricing */}
        {tab === "pricing" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Pricing Type</label>
              <select value={form.pricing_type} onChange={f("pricing_type")} className={inputCls}>
                <option value="negotiable">Negotiable</option>
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
                <option value="per_event">Per Event</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Starting Price</label>
              <input type="number" min={0} value={form.starting_price} onChange={f("starting_price")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Currency</label>
              <input type="text" value={form.currency} onChange={f("currency")} className={inputCls} placeholder="NGN" />
            </div>
          </div>
        )}

        {/* Tab: Social */}
        {tab === "social" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube", "website"] as const).map((key) => (
              <div key={key}>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input type="url" value={(form as unknown as Record<string, string>)[key]} onChange={f(key)} placeholder={`https://${key}.com/...`} className={inputCls} />
              </div>
            ))}
          </div>
        )}

        {/* Tab: Badges */}
        {tab === "badges" && (
          <div className="space-y-3">
            {(
              [
                { key: "verified", label: "Verified", desc: "Shows blue badge on profile" },
                { key: "featured", label: "Featured", desc: "Appears in featured section on homepage" },
                { key: "top_rated", label: "Top Rated", desc: "Shows 'Top Rated' label on card" },
                { key: "most_booked", label: "Most Booked", desc: "Shows 'Most Booked' label on card" },
                { key: "fast_responder", label: "Fast Responder", desc: "Shows 'Fast Responder' label on card" },
              ] as { key: keyof typeof form; label: string; desc: string }[]
            ).map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#E8EBE7] dark:border-white/10 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                <div>
                  <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{label}</p>
                  <p className="text-xs text-zinc-400">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={form[key] as boolean}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-500"
                />
              </label>
            ))}
          </div>
        )}
      </form>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E8EBE7] dark:border-white/10">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" /> Delete Professional?
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              This will permanently delete <strong>{initial.professional_name}</strong>&apos;s profile and all their portfolio items. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={actionLoading === "delete"}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Yes, Delete Permanently
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E8EBE7] dark:border-white/10">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Reject Application</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Rejecting <strong>{initial.professional_name}</strong>. Please provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason (shown to the professional)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={async () => {
                  await runAction("Rejected", () => rejectProfessional(initial.id, rejectReason));
                  setRejectModal(false);
                  setRejectReason("");
                }}
                disabled={!rejectReason.trim() || !!actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all disabled:opacity-40"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => { setRejectModal(false); setRejectReason(""); }}
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
