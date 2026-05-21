"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, PlusCircle, Trash2, Mail, Loader2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface OrgEvent {
  id: string;
  title: string;
}

interface StaffScanner {
  id: string;
  staff_id: string;
  event_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
  events: {
    title: string;
  } | null;
}

interface ScannerRow {
  id: string;
  staff_id: string;
  event_id: string;
  profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  events: { title: string } | { title: string }[] | null;
}

export default function TeamAccessPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [scanners, setScanners] = useState<StaffScanner[]>([]);
  const [email, setEmail] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch organizer's events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title")
        .eq("organizer_id", user.id);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
      if (eventsData && eventsData.length > 0) {
        setSelectedEventId(eventsData[0].id);
      }

      // 2. Fetch scanner staff assigned to those events
      const eventIds = eventsData?.map((e) => e.id) || [];
      if (eventIds.length > 0) {
        const { data: scannersData, error: scannersError } = await supabase
          .from("scanners")
          .select(`
            id,
            staff_id,
            event_id,
            profiles:staff_id (
              full_name,
              email
            ),
            events:event_id (
              title
            )
          `)
          .in("event_id", eventIds);

        if (scannersError) throw scannersError;

        const castedScanners: StaffScanner[] = (scannersData as ScannerRow[] || []).map((s) => ({
          id: s.id,
          staff_id: s.staff_id,
          event_id: s.event_id,
          profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
          events: Array.isArray(s.events) ? s.events[0] : s.events,
        }));

        setScanners(castedScanners);
      } else {
        setScanners([]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load team data.";
      console.error("Error loading team access details:", err);
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  async function handleAddStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !selectedEventId) return;

    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized session.");

      // 1. Find profile by email address
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        throw new Error(
          "No user account found with this email. Please ask your staff member to register on OakTix first."
        );
      }

      // 2. Check if already assigned to this event
      const { data: existingAssignment, error: checkError } = await supabase
        .from("scanners")
        .select("id")
        .eq("staff_id", profile.id)
        .eq("event_id", selectedEventId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAssignment) {
        throw new Error(
          "This staff member is already assigned to scan tickets for the selected event."
        );
      }

      // 3. Add to scanners table
      const { error: insertError } = await supabase.from("scanners").insert({
        staff_id: profile.id,
        event_id: selectedEventId,
        assigned_by: user.id,
      });

      if (insertError) throw insertError;

      // 4. Upgrade role to staff if they are currently a regular user
      if (profile.role === "user") {
        await supabase
          .from("profiles")
          .update({ role: "staff" })
          .eq("id", profile.id);
      }

      setSuccessMsg("Staff member added successfully!");
      setEmail("");
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add staff member.";
      setErrorMsg(message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveStaff(scannerId: string) {
    if (
      !confirm(
        "Are you sure you want to remove this staff member? They will no longer be able to scan tickets for this event."
      )
    )
      return;

    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("scanners").delete().eq("id", scannerId);
      if (error) throw error;
      setSuccessMsg("Staff member removed successfully.");
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove staff member.";
      setErrorMsg(message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-500" /> Team Access
          </h1>
          <p className="text-zinc-500">
            Authorize staff members to scan tickets and manage guests at your event gates.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-semibold shadow-sm">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 font-semibold shadow-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Add Staff Form */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Add Scanner Staff</p>
                <p className="text-xs text-zinc-500">Grant ticket scan permission</p>
              </div>
            </div>

            {events.length === 0 && !loading ? (
              <div className="p-4 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <p className="text-xs text-zinc-500 font-semibold">
                  You need to create an event first before adding scanning staff.
                </p>
                <Link
                  href="/organizer/events/new"
                  className="text-xs text-indigo-500 font-bold hover:underline block mt-2"
                >
                  Create an Event
                </Link>
              </div>
            ) : (
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="staffEmail" className="text-xs font-bold text-zinc-600">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      id="staffEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none font-medium focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="targetEvent" className="text-xs font-bold text-zinc-600">
                    Select Event
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <select
                      id="targetEvent"
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none bg-white font-medium text-zinc-700 focus:border-indigo-400 transition-colors"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !email.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Authorize Staff"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Authorized Staff List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold font-heading">Authorized Scanner Staff</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : scanners.length === 0 ? (
            <div className="glass-card p-12 text-center bg-white border border-[#E8EBE7] shadow-sm">
              <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="font-bold text-zinc-700">No scanner staff authorized yet</p>
              <p className="text-zinc-500 text-sm mt-1">
                Authorized staff members will appear here. They can log in to check in guests.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden bg-white border border-[#E8EBE7] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EBE7] bg-zinc-50/50">
                      <th className="p-4 font-bold text-zinc-600">Staff Member</th>
                      <th className="p-4 font-bold text-zinc-600">Authorized Event</th>
                      <th className="p-4 font-bold text-zinc-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBE7]">
                    {scanners.map((scanner) => (
                      <tr key={scanner.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-zinc-800">
                            {scanner.profiles?.full_name || "OakTix User"}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {scanner.profiles?.email || "No email"}
                          </p>
                        </td>
                        <td className="p-4 text-zinc-700 font-semibold">
                          {scanner.events?.title || "Unknown Event"}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRemoveStaff(scanner.id)}
                            disabled={actionLoading}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                            title="Revoke access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
