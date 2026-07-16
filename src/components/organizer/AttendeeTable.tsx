"use client";

import { useState } from "react";
import { Search, Download, ArrowUpDown, Check, X, Loader2 } from "lucide-react";

interface Profile {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Event {
  id: string;
  title: string;
}

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

interface Ticket {
  id: string;
  event_id: string;
  unique_code?: string;
  price_paid?: number;
  status?: string;
  registration_status?: string;
  profiles?: Profile | null;
  events?: Event | null;
  ticket_type?: TicketType | null;
}

interface AttendeeTableProps {
  initialTickets: Ticket[];
  events: Event[];
}

type RegAction = "approve" | "reject" | "waitlist";

const REG_STATUSES = ["approved", "pending", "waitlist", "rejected"] as const;

const regBadgeClasses: Record<string, string> = {
  approved: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  waitlist: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
  rejected: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function AttendeeTable({ initialTickets, events }: AttendeeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [tickets, setTickets] = useState(initialTickets);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

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
      } else if (key === "phone") {
        valA = a.profiles?.phone || "";
        valB = b.profiles?.phone || "";
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

    const phone = t.profiles?.phone?.toLowerCase() || "";
    const matchesSearch = name.includes(search) || email.includes(search) || code.includes(search) || phone.includes(search);
    const matchesEvent = selectedEvent === "all" || t.event_id === selectedEvent;
    const reg = t.registration_status || "approved";
    const matchesStatus = selectedStatus === "all" || reg === selectedStatus;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  /** POST a registration action and optimistically update local state. */
  const runAction = async (action: RegAction, ids: string[]) => {
    if (ids.length === 0) return;
    const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "waitlist";

    setPendingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    try {
      const res = await fetch(`/api/organizer/registrations/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_ids: ids }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Action failed");
      }
      setTickets((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, registration_status: nextStatus } : t))
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err) {
      console.error("Registration action failed:", err);
      alert((err as Error).message || "Action failed");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredTickets.map((t) => t.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id)) && visibleIds.length > 0;
    setSelectedIds(() => (allSelected ? new Set() : new Set(visibleIds)));
  };

  const runBulk = async (action: RegAction) => {
    setBulkBusy(true);
    await runAction(action, Array.from(selectedIds));
    setBulkBusy(false);
  };

  const exportCSV = () => {
    const headers = ["Attendee Name", "Email", "Phone", "Event", "Ticket Code", "Tier", "Price Paid (NGN)", "Status", "Registration"];
    const rows = filteredTickets.map((t) => [
      t.profiles?.full_name || "N/A",
      t.profiles?.email || "N/A",
      t.profiles?.phone || "N/A",
      t.events?.title || "N/A",
      t.unique_code || "",
      t.ticket_type?.name || "General Admission",
      t.price_paid || 0,
      t.status || "active",
      t.registration_status || "approved",
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

  const allVisibleSelected =
    filteredTickets.length > 0 && filteredTickets.every((t) => selectedIds.has(t.id));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or ticket code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition-colors placeholder:text-zinc-500 text-zinc-900 dark:text-white text-sm"
            />
          </div>
          <select
            title="Filter by event"
            aria-label="Filter by event"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition-colors text-sm text-zinc-900 dark:text-zinc-300"
          >
            <option value="all">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <select
            title="Filter by registration status"
            aria-label="Filter by registration status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition-colors text-sm text-zinc-900 dark:text-zinc-300 capitalize"
          >
            <option value="all">All Statuses</option>
            {REG_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-6 py-4 rounded-2xl">
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => runBulk("approve")}
              disabled={bulkBusy}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve selected
            </button>
            <button
              onClick={() => runBulk("reject")}
              disabled={bulkBusy}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden border-zinc-200 dark:border-transparent bg-white dark:bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 text-xs uppercase font-bold text-zinc-600 dark:text-zinc-400">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    title="Select all"
                    aria-label="Select all"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
                <th className="p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">Attendee <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleSort("email")}>
                  <div className="flex items-center gap-1">Email <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleSort("phone")}>
                  <div className="flex items-center gap-1">Phone <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleSort("event")}>
                  <div className="flex items-center gap-1">Event <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleSort("code")}>
                  <div className="flex items-center gap-1">Ticket Code <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4">Tier</th>
                <th className="p-4">Price Paid</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registration</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-zinc-500">
                    No attendees found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const reg = t.registration_status || "approved";
                  const busy = pendingIds.has(t.id);
                  const canAct = reg === "pending" || reg === "waitlist";
                  return (
                    <tr key={t.id} className="border-b border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-sm text-zinc-900 dark:text-white">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          title="Select row"
                          aria-label="Select row"
                          checked={selectedIds.has(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-bold">{t.profiles?.full_name || "Anonymous"}</td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-400">{t.profiles?.email || "N/A"}</td>
                      <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">{t.profiles?.phone || "N/A"}</td>
                      <td className="p-4 font-medium">{t.events?.title || "N/A"}</td>
                      <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">{t.unique_code}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300">
                          {t.ticket_type?.name || "GA"}
                        </span>
                      </td>
                      <td className="p-4 font-bold">₦{Number(t.price_paid || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          t.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}>
                          {t.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase ${regBadgeClasses[reg] || regBadgeClasses.approved}`}>
                          {reg}
                        </span>
                      </td>
                      <td className="p-4">
                        {canAct ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => runAction("approve", [t.id])}
                              disabled={busy}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
                            </button>
                            <button
                              onClick={() => runAction("reject", [t.id])}
                              disabled={busy}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
