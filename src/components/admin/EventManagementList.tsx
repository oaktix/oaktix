"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, MapPin, Trash2, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Eye } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'sold_out' | 'completed' | 'cancelled';
  start_date: string;
  max_attendees?: number;
  featured_image?: string;
  venue_details?: { name?: string; address?: string };
  ticket_types?: unknown[];
  absorb_fees?: boolean;
  organizer?: {
    full_name?: string;
    email?: string;
    vendor_details?: { business_name?: string };
  };
}

interface EventManagementProps {
  initialEvents: EventItem[];
}

export default function EventManagementList({ initialEvents }: EventManagementProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("events-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        async () => {
          const { data } = await supabase
            .from("events")
            .select(`
              *,
              organizer:profiles (
                full_name,
                email,
                vendor_details
              )
            `)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });
          if (data) {
            setEvents(data as unknown as EventItem[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredEvents = events.filter((e) => {
    const title = e.title?.toLowerCase() || "";
    const organizerName = e.organizer?.full_name?.toLowerCase() || "";
    const bizName = e.organizer?.vendor_details?.business_name?.toLowerCase() || "";
    const term = search.toLowerCase();
    return title.includes(term) || organizerName.includes(term) || bizName.includes(term);
  });

  const handleUpdateStatus = async (eventId: string, newStatus: string) => {
    setLoadingId(eventId);
    setError(null);

    try {
      const response = await fetch("/api/admin/events/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update event status");

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: newStatus as EventItem['status'] } : e))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating event");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you absolutely sure you want to permanently delete this event? This action is irreversible and will delete all associated tickets.")) {
      return;
    }

    setLoadingId(eventId);
    setError(null);

    try {
      const response = await fetch("/api/admin/events/status", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to delete event");

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting event");
    } finally {
      setLoadingId(null);
    }
  };

  const total = events.length;
  const publishedCount = events.filter((e) => e.status === "published").length;
  const draftCount = events.filter((e) => e.status === "draft").length;
  const otherCount = total - publishedCount - draftCount;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Events</p>
            <p className="text-3xl font-bold font-heading text-white">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Live & Active</p>
            <p className="text-3xl font-bold font-heading text-emerald-400">{publishedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Draft Creations</p>
            <p className="text-3xl font-bold font-heading text-zinc-400">{draftCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Ended / Cancelled</p>
            <p className="text-3xl font-bold font-heading text-amber-500">{otherCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filtering Header & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-zinc-900/20 border border-zinc-850 p-4 rounded-2xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search events by title or organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-850 bg-black/20 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900/40">
              <th className="px-6 py-4">Event details</th>
              <th className="px-6 py-4">Organizer</th>
              <th className="px-6 py-4">Capacity & Fee Setup</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-sm">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium bg-zinc-950/20">
                  No events found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => {
                const orgName = event.organizer?.vendor_details?.business_name || event.organizer?.full_name || "OakTix Organizer";
                const orgEmail = event.organizer?.email || "Unknown Email";
                const dateStr = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.start_date));
                const venueName = event.venue_details?.name || "Virtual Location";

                return (
                  <tr key={event.id} className="hover:bg-zinc-900/20 transition-all duration-150">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden relative shrink-0 border border-zinc-700">
                          {event.featured_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={event.featured_image} alt={event.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                              OAKTIX
                            </div>
                          )}
                        </div>
                        <div>
                          {event.slug ? (
                            <Link href={`/events/${event.slug}`} target="_blank" className="font-bold text-zinc-100 text-sm hover:underline hover:text-indigo-400 flex items-center gap-1">
                              {event.title} <Eye className="w-3.5 h-3.5 inline text-zinc-500" />
                            </Link>
                          ) : (
                            <span className="font-bold text-zinc-400 text-sm flex items-center gap-1" title="No slug — organiser must re-save this event">
                              {event.title} <Eye className="w-3.5 h-3.5 inline text-zinc-600" />
                            </span>
                          )}
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-650" /> {venueName}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{dateStr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-zinc-200">{orgName}</p>
                        <p className="text-xs text-zinc-500">{orgEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-400 font-semibold">
                          Capacity: <span className="font-bold text-zinc-200">{event.max_attendees ? event.max_attendees.toLocaleString() : "Unlimited"}</span>
                        </p>
                        <div className="text-[10px]">
                          {event.absorb_fees ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase">
                              Absorbs platform fee
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">
                              Adds fee to ticket
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {event.status === "published" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Published
                        </span>
                      ) : event.status === "draft" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-700/30 border border-zinc-700/50 text-zinc-400">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-505">
                          {event.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {event.status === "draft" ? (
                          <button
                            onClick={() => handleUpdateStatus(event.id, "published")}
                            disabled={loadingId === event.id}
                            className="p-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            title="Publish Event"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Publish
                          </button>
                        ) : event.status === "published" ? (
                          <button
                            onClick={() => handleUpdateStatus(event.id, "draft")}
                            disabled={loadingId === event.id}
                            className="p-2 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            title="Unpublish (Set to Draft)"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Revert to Draft
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={loadingId === event.id}
                          className="p-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all disabled:opacity-50 cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
