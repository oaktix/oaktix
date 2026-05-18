"use client";

import { useState } from "react";
import TicketSelectionModal from "./TicketSelectionModal";

interface TicketType {
  name: string;
  price: number;
  description?: string;
  perks?: string[];
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

  const ticketTypes = event.ticket_types || [];

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {ticketTypes.map((ticket: TicketType, idx: number) => (
          <div key={idx} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-indigo-500/10 hover:border-indigo-500/30 transition-colors group">
            <div className="space-y-1">
              <h3 className="text-xl font-bold font-heading group-hover:text-indigo-400 transition-colors">{ticket.name}</h3>
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
                <p className="text-2xl font-bold font-heading">₦{Number(ticket.price).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(ticket)}
                className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
              >
                Select
              </button>
            </div>
          </div>
        ))}
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
