"use client";

import { useState } from "react";
import { Phone, X, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OrganizerPhoneModal() {
  const [dismissed, setDismissed] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (dismissed) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please refresh.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ phone: trimmed })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      setError("Failed to save phone number. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setDismissed(true), 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm glass-card bg-white border border-[#E8EBE7] shadow-2xl shadow-black/10 rounded-2xl p-6 relative">
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {saved ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
            <p className="font-bold text-zinc-800">Phone number saved!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-900 text-sm">Add your phone number</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Required for account security and WhatsApp notifications.</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348012345678"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] bg-white text-sm text-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-400"
                />
                {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Number"}
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8EBE7] text-zinc-500 hover:text-zinc-700 font-bold text-sm transition-all"
                >
                  Later
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
