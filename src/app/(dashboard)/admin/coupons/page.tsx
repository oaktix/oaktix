"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tag, Plus, Trash2, Calendar, Percent, DollarSign, X, Loader2, User } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  event_id: string | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  events?: { title: string } | null;
  creator?: { full_name: string | null; role: string } | null;
}

interface EventData {
  id: string;
  title: string;
}

export default function AdminCouponsPage() {
  const supabase = createClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [eventId, setEventId] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const fetchCouponsAndEvents = async () => {
    try {
      // 1. Fetch all events on the platform for scoping options
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title")
        .eq("status", "published")
        .order("title");
      setEvents(eventsData || []);

      // 2. Fetch all coupons with creators and events details
      const { data: couponsData } = await supabase
        .from("coupons")
        .select("*, events:event_id(title), creator:profiles!creator_id(full_name, role)")
        .order("created_at", { ascending: false });

      setCoupons((couponsData as unknown as Coupon[]) || []);
    } catch (err) {
      console.error("Error loading coupons data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponsAndEvents();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!code.trim()) throw new Error("Coupon code is required");
      if (!discountValue || Number(discountValue) <= 0) throw new Error("Discount value must be greater than 0");

      const insertData = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        max_uses: maxUses ? parseInt(maxUses) : null,
        event_id: eventId || null,
        creator_id: user.id,
        valid_from: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      };

      const { error } = await supabase
        .from("coupons")
        .insert(insertData);

      if (error) {
        if (error.code === "23505") {
          throw new Error("A coupon with this code already exists.");
        }
        throw new Error(error.message);
      }

      setOpenModal(false);
      setCode("");
      setDiscountType("percentage");
      setDiscountValue("");
      setMaxUses("");
      setEventId("");
      setValidFrom("");
      setValidUntil("");
      
      fetchCouponsAndEvents();
    } catch (err) {
      setErrorMessage((err as Error).message || "Failed to create coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon? This will immediately revoke it from checking out.")) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchCouponsAndEvents();
    } catch (err) {
      console.error("Error deleting coupon:", err);
      alert("Failed to delete coupon.");
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { label: "Scheduled", color: "bg-blue-500/10 text-blue-400 border-blue-500/25" };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { label: "Expired", color: "bg-red-500/10 text-red-400 border-red-500/25" };
    }
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return { label: "Used Up", color: "bg-amber-500/10 text-amber-400 border-amber-500/25" };
    }
    return { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-650/10 flex items-center justify-center">
            <Tag className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Global Coupons</h1>
            <p className="text-zinc-400">Manage vendor promo codes and create global platform discounts.</p>
          </div>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Global Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center text-center space-y-4 border-dashed border-white/5 bg-transparent">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Tag className="w-8 h-8 text-zinc-650" />
          </div>
          <div>
            <p className="text-lg font-bold">No coupons on the platform</p>
            <p className="text-zinc-550 text-sm max-w-xs mx-auto mt-1">Create a global coupon to distribute discount campaigns platform-wide.</p>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-white/10 bg-zinc-950/40 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-400 text-xs font-bold uppercase bg-zinc-950/50">
                  <th className="p-4 sm:p-5">Code</th>
                  <th className="p-4 sm:p-5">Discount</th>
                  <th className="p-4 sm:p-5">Scope</th>
                  <th className="p-4 sm:p-5">Creator</th>
                  <th className="p-4 sm:p-5">Uses</th>
                  <th className="p-4 sm:p-5">Validity</th>
                  <th className="p-4 sm:p-5">Status</th>
                  <th className="p-4 sm:p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const isCreatorAdmin = coupon.creator?.role === "admin" || coupon.creator?.role === "super_admin";
                  return (
                    <tr key={coupon.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 sm:p-5 font-bold font-mono text-white">
                        <span className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700/60">{coupon.code}</span>
                      </td>
                      <td className="p-4 sm:p-5 font-semibold text-zinc-200">
                        {coupon.discount_type === "percentage" ? (
                          <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5 text-zinc-450" /> {coupon.discount_value}% Off</span>
                        ) : (
                          <span className="flex items-center gap-0.5"><DollarSign className="w-3.5 h-3.5 text-zinc-450" /> ₦{Number(coupon.discount_value).toLocaleString()} Off</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-zinc-300">
                        {coupon.event_id ? (
                          <span className="text-indigo-400 font-medium line-clamp-1 max-w-[150px]" title={coupon.events?.title}>
                            {coupon.events?.title}
                          </span>
                        ) : isCreatorAdmin ? (
                          <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">Global Platform</span>
                        ) : (
                          <span className="text-zinc-450 text-xs font-semibold uppercase tracking-wide">All Vendor Events</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-850 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-zinc-450" />
                          </div>
                          <div>
                            <p className="text-zinc-200 font-medium text-xs">{coupon.creator?.full_name || "Unknown"}</p>
                            <span className="text-[9px] text-zinc-550 uppercase font-bold">{coupon.creator?.role || "user"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 sm:p-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{coupon.used_count} <span className="text-zinc-550 font-normal">uses</span></span>
                          {coupon.max_uses && (
                            <span className="text-[10px] text-zinc-500">Max: {coupon.max_uses}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 sm:p-5 text-xs text-zinc-400 space-y-0.5">
                        <p>From: {new Date(coupon.valid_from).toLocaleDateString()}</p>
                        {coupon.valid_until ? (
                          <p>Until: {new Date(coupon.valid_until).toLocaleDateString()}</p>
                        ) : (
                          <p className="text-zinc-650">Never expires</p>
                        )}
                      </td>
                      <td className="p-4 sm:p-5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 sm:p-5 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Revoke / Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Global Coupon Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold font-heading text-white">Create Global Coupon</h3>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-zinc-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., PLATFORM15"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none uppercase font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400">Limit to Specific Event</label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full mt-1 bg-zinc-850 border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-white cursor-pointer"
                  >
                    <option value="">Global (All Platform Events)</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>{evt.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                    className="w-full mt-1 bg-zinc-850 border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-white cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400">
                    Discount Value {discountType === "percentage" ? "(%)" : "(₦)"}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    placeholder={discountType === "percentage" ? "15" : "2000"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400">Max Usage Limit (Optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave blank for unlimited platform uses"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-450" /> Valid From</label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-450" /> Valid Until (Optional)</label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold transition-all flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Coupon"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
