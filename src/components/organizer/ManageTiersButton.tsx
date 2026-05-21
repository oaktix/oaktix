"use client";

import { useState } from "react";
import { Ticket, X, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TicketType {
  name: string;
  price: number;
  description?: string;
  perks?: string[];
  is_closed?: boolean;
}

interface ManageTiersButtonProps {
  eventId: string;
  eventTitle: string;
  ticketTypes: TicketType[];
}

export default function ManageTiersButton({ eventId, eventTitle, ticketTypes: initialTiers }: ManageTiersButtonProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [tiers, setTiers] = useState<TicketType[]>(initialTiers || []);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleTier(index: number) {
    setSaving(index);
    setError(null);

    const updatedTiers = tiers.map((t, i) =>
      i === index ? { ...t, is_closed: !t.is_closed } : t
    );

    const { error: updateError } = await supabase
      .from("events")
      .update({ ticket_types: updatedTiers })
      .eq("id", eventId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setTiers(updatedTiers);
    }
    setSaving(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 hover:text-amber-400 transition-all text-sm font-bold text-zinc-300 flex items-center justify-center gap-1.5 w-full sm:w-auto"
      >
        <Ticket className="w-4 h-4" /> Manage Tiers
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading">Manage Ticket Tiers</h3>
                <p className="text-zinc-500 text-sm mt-0.5 line-clamp-1">{eventTitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Tiers List */}
            <div className="space-y-3">
              {tiers.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No ticket tiers defined.</p>
              ) : (
                tiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      tier.is_closed
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{tier.name || "Unnamed Tier"}</p>
                      <p className="text-xs text-zinc-500">
                        {tier.price > 0 ? `₦${Number(tier.price).toLocaleString()}` : "Free"}{" "}
                        {tier.is_closed && (
                          <span className="text-red-400 font-bold ml-1">• CLOSED</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleTier(idx)}
                      disabled={saving === idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer hover:bg-white/5"
                      title={tier.is_closed ? "Reopen this tier" : "Close this tier (mark as Sold Out)"}
                    >
                      {saving === idx ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      ) : tier.is_closed ? (
                        <>
                          <ToggleLeft className="w-5 h-5 text-red-400" />
                          <span className="text-red-400">Closed</span>
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400">Open</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Closing a tier marks it as Sold Out on the public event page. Other tiers remain available. Toggle to reopen.
            </p>

            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-sm transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
