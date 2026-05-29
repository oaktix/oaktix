"use client";

import { useState } from "react";
import { Search, Download, ArrowUpDown } from "lucide-react";

interface Profile {
  full_name?: string | null;
  email?: string | null;
}

interface Event {
  id: string;
  title: string;
}

interface TicketType {
  name: string;
  price: number;
  early_bird_price?: number | null;
  description?: string;
  perks?: string[];
  is_closed?: boolean;
  capacity?: number;
  sold_count?: number;
  early_bird_until?: string;
}

interface Ticket {
  id: string;
  event_id: string;
  unique_code?: string;
  price_paid?: number;
  status?: string;
  profiles?: Profile | null;
  events?: Event | null;
  ticket_type?: TicketType | null;
}

interface AttendeeTableProps {
  initialTickets: Ticket[];
  events: Event[];
}

export default function AttendeeTable({ initialTickets, events }: AttendeeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [tickets, setTickets] = useState(initialTickets);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedTickets = [...tickets].sort((a, b) => {
      let valA = "";
      let valB = "";

      if (key === "name") {
        valA = a.profiles?.full_name || "";
        valB = b.profiles?.full_name || "";
      } else if (key === "email") {
        valA = a.profiles?.email || "";
        valB = b.profiles?.email || "";
      } else if (key === "event") {
        valA = a.events?.title || "";
        valB = b.events?.title || "";
      } else if (key === "code") {
        valA = a.unique_code || "";
        valB = b.unique_code || "";
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setTickets(sortedTickets);
  };

  const filteredTickets = tickets.filter((t) => {
    const name = t.profiles?.full_name?.toLowerCase() || "";
    const email = t.profiles?.email?.toLowerCase() || "";
    const code = t.unique_code?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch = name.includes(search) || email.includes(search) || code.includes(search);
    const matchesEvent = selectedEvent === "all" || t.event_id === selectedEvent;

    return matchesSearch && matchesEvent;
  });

  const exportCSV = () => {
    const headers = ["Attendee Name", "Email", "Event", "Ticket Code", "Tier", "Price Paid (NGN)", "Status"];
    const rows = filteredTickets.map((t) => [
      t.profiles?.full_name || "N/A",
      t.profiles?.email || "N/A",
      t.events?.title || "N/A",
      t.unique_code || "",
      t.ticket_type?.name || "General Admission",
      t.price_paid || 0,
      t.status || "active"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white/5 border border-white/5 p-6 rounded-2xl">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or ticket code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-500 text-sm"
            />
          </div>
          <select
            title="Filter by event"
            aria-label="Filter by event"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-300"
          >
            <option value="all">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden border-transparent bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase font-bold text-zinc-400">
                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">Attendee <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("email")}>
                  <div className="flex items-center gap-1">Email <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("event")}>
                  <div className="flex items-center gap-1">Event <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("code")}>
                  <div className="flex items-center gap-1">Ticket Code <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4">Tier</th>
                <th className="p-4">Price Paid</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    No attendees found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                    <td className="p-4 font-bold">{t.profiles?.full_name || "Anonymous"}</td>
                    <td className="p-4 text-zinc-400">{t.profiles?.email || "N/A"}</td>
                    <td className="p-4 font-medium">{t.events?.title || "N/A"}</td>
                    <td className="p-4 font-mono text-zinc-400">{t.unique_code}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-zinc-300">
                        {t.ticket_type?.name || "GA"}
                      </span>
                    </td>
                    <td className="p-4 font-bold">₦{Number(t.price_paid || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                        t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {t.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
