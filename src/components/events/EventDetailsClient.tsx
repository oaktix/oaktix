"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import TicketSelectionModal from "./TicketSelectionModal";

interface TicketType {
  name: string;
  price: number;
  early_bird_price?: number | null;
  early_bird_capacity?: number | null;
  description?: string;
  perks?: string[];
  is_closed?: boolean;
  capacity?: number;
  sold_count?: number;
  early_bird_until?: string;
}

interface EventDetailsClientProps {
  event: {
    id: string;
    title: string;
    slug: string;
    start_date?: string;
    end_date?: string;
    ticket_types: TicketType[];
    absorb_fees?: boolean;
    show_ticket_volume?: boolean;
  };
  user: {
    id: string;
    email: string;
  } | null;
}

export default function EventDetailsClient({ event, user }: EventDetailsClientProps) {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const searchParams = useSearchParams();

  const isSuccess = searchParams.get("checkout") === "success";
  const ref = searchParams.get("reference");
  const ticketTypes = event.ticket_types || [];

  return (
    <>
      {isSuccess && (
        <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-4 shadow-lg shadow-emerald-500/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-zinc-900 dark:text-white text-base">Booking Confirmed! 🎉</h4>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Your tickets and secure QR codes have been successfully generated and sent to your email address. 
            </p>
            {ref && (
              <p className="text-zinc-500 text-xs font-mono pt-1">
                Booking Reference: <span className="text-zinc-600 dark:text-zinc-350">{ref}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {ticketTypes.map((ticket: TicketType, idx: number) => {
          const isClosed = ticket.is_closed === true;
          const isSoldOut = ticket.capacity !== undefined && ticket.capacity !== null && Number(ticket.capacity) > 0
            ? (ticket.sold_count || 0) >= Number(ticket.capacity)
            : false;
          const now = new Date();
          
          const isEventPast = (() => {
            const end = event.end_date ? new Date(event.end_date).getTime() : event.start_date ? new Date(event.start_date).getTime() : null;
            if (!end) return false;
            const thresholdTime = now.getTime() - 3 * 60 * 60 * 1000;
            return end < thresholdTime;
          })();

          const isEarlyBirdConfigured = ticket.early_bird_price !== undefined && ticket.early_bird_price !== null;
          const isExpiredByDate = ticket.early_bird_until ? new Date(ticket.early_bird_until) < now : false;
          const soldCount = ticket.sold_count || 0;
          const hasCapacityLeft = ticket.early_bird_capacity ? soldCount < ticket.early_bird_capacity : true;

          const isEarlyBirdActive = isEarlyBirdConfigured && !isExpiredByDate && hasCapacityLeft;

          const isUnavailable = isClosed || isSoldOut || isEventPast;

          let statusBadge = null;
          let actionButtonText = "Select";

          if (isEventPast) {
            statusBadge = (
              <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-500/15 border border-zinc-500/30 text-zinc-400">
                Ended
              </span>
            );
            actionButtonText = "Event Ended";
          } else if (isClosed || isSoldOut) {
            statusBadge = (
              <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/15 border border-red-500/30 text-red-400">
                Sold Out
              </span>
            );
            actionButtonText = "Sold Out";
          }

          // Show remaining tickets count
          let capacityText = null;
          if (event.show_ticket_volume && ticket.capacity && !isUnavailable) {
            const remaining = Number(ticket.capacity) - (ticket.sold_count || 0);
            if (remaining <= 5) {
              capacityText = (
                <span className="text-rose-500 text-xs font-bold block mt-1">
                  🔥 Only {remaining} left!
                </span>
              );
            } else {
              capacityText = (
                <span className="text-zinc-400 text-xs block mt-1">
                  {remaining} tickets available
                </span>
              );
            }
          }

          // Show early bird active indicator
          let earlyBirdText = null;
          if (isEarlyBirdActive && (ticket.early_bird_until || ticket.early_bird_capacity)) {
            let details = [];
            if (ticket.early_bird_until) {
              const dateStr = new Date(ticket.early_bird_until).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
              });
              details.push(`ends ${dateStr}`);
            }
            if (ticket.early_bird_capacity && event.show_ticket_volume) {
              details.push(`${ticket.early_bird_capacity - soldCount} left`);
            }
            
            earlyBirdText = (
              <span className="text-amber-400 text-xs font-bold block mt-1">
                ⏳ Early bird {details.join(" • ")}
              </span>
            );
          }

          return (
            <div 
              key={idx} 
              className={`glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors group ${
                isUnavailable 
                  ? "border-red-500/10 opacity-60" 
                  : "border-indigo-500/10 hover:border-indigo-500/30"
              }`}
            >
              <div className="space-y-1">
                <h3 className={`text-xl font-bold font-heading transition-colors flex items-center ${
                  isUnavailable ? "text-zinc-400 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500"
                }`}>
                  {ticket.name}
                  {statusBadge}
                </h3>
                <p className="text-zinc-500 text-sm">{ticket.description || "Access to the event."}</p>
                
                {capacityText}
                {earlyBirdText}

                {ticket.perks && ticket.perks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ticket.perks.map((perk: string, pIdx: number) => (
                      <span key={pIdx} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400">
                        {perk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Price</p>
                  {isEarlyBirdActive ? (
                    <>
                      <p className="text-xs text-amber-600 font-bold mb-1">
                        Early‑bird! ✅
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-amber-500 line-through text-sm">₦{Number(ticket.price).toLocaleString()}</span>
                        <span className="text-xl font-bold text-amber-600">₦{Number(ticket.early_bird_price ?? ticket.price).toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <p className={`text-2xl font-bold font-heading ${isUnavailable ? "text-zinc-400" : "text-zinc-900 dark:text-white"}`}>
                      ₦{Number(ticket.price).toLocaleString()}
                    </p>
                  )}
                </div>
                {isUnavailable ? (
                  <button 
                    disabled
                    className="px-8 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-400 dark:text-zinc-500 font-bold cursor-not-allowed select-none min-w-[120px]"
                  >
                    {actionButtonText}
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors min-w-[120px]"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTicket && (
        <TicketSelectionModal 
          event={event}
          ticketType={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}
