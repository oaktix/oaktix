"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import TicketSelectionModal from "./TicketSelectionModal";

interface TicketType {
  name: string;
  price: number;
  description?: string;
  perks?: string[];
  is_closed?: boolean;
}

interface EventDetailsClientProps {
  event: {
    id: string;
    title: string;
    slug: string;
    ticket_types: TicketType[];
    absorb_fees?: boolean;
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
            <h4 className="font-bold text-white text-base">Booking Confirmed! 🎉</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your tickets and secure QR codes have been successfully generated and sent to your email address. 
            </p>
            {ref && (
              <p className="text-zinc-500 text-xs font-mono pt-1">
                Booking Reference: <span className="text-zinc-350">{ref}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {ticketTypes.map((ticket: TicketType, idx: number) => {
          const isClosed = ticket.is_closed === true;
          return (
            <div 
              key={idx} 
              className={`glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors group ${
                isClosed 
                  ? "border-red-500/10 opacity-60" 
                  : "border-indigo-500/10 hover:border-indigo-500/30"
              }`}
            >
              <div className="space-y-1">
                <h3 className={`text-xl font-bold font-heading transition-colors ${
                  isClosed ? "text-zinc-400" : "group-hover:text-indigo-400"
                }`}>
                  {ticket.name}
                  {isClosed && (
                    <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/15 border border-red-500/30 text-red-400">
                      Sold Out
                    </span>
                  )}
                </h3>
                <p className="text-zinc-500 text-sm">{ticket.description || "Access to the event."}</p>
                {ticket.perks && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ticket.perks.map((perk: string, pIdx: number) => (
                      <span key={pIdx} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                        {perk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Price</p>
                  <p className={`text-2xl font-bold font-heading ${isClosed ? "text-zinc-400" : ""}`}>
                    ₦{Number(ticket.price).toLocaleString()}
                  </p>
                </div>
                {isClosed ? (
                  <button 
                    disabled
                    className="px-8 py-3 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-500 font-bold cursor-not-allowed select-none"
                  >
                    Sold Out
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
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
