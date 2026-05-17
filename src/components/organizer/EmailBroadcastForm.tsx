"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle, Loader2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
}

interface Log {
  id: string;
  event_id: string;
  events?: { title: string } | null;
  subject: string;
  recipient_count: number;
  status: string;
  sent_at: string;
}

interface EmailBroadcastFormProps {
  events: Event[];
  initialLogs: Log[];
}

export default function EmailBroadcastForm({ events, initialLogs }: EmailBroadcastFormProps) {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState(initialLogs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !subject || !message) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/organizer/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send broadcast");

      setSuccess(data.message || "Email successfully broadcasted!");
      setSubject("");
      setMessage("");
      
      // Update logs in view
      const selectedEv = events.find(ev => ev.id === selectedEvent);
      const newLog: Log = {
        id: Math.random().toString(),
        event_id: selectedEvent,
        events: { title: selectedEv?.title || "Event" },
        subject,
        recipient_count: data.recipientCount,
        status: "sent",
        sent_at: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);

    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || "An error occurred while sending");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Compose Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            New Broadcast Update
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> {success}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Target Event</label>
              <select
                title="Target Event"
                aria-label="Target Event"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-300"
              >
                <option value="">Select Event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Email Subject</label>
              <input
                type="text"
                placeholder="Important update about Lagos Tech Summit..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Message Content</label>
              <textarea
                placeholder="Write your email here..."
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm placeholder:text-zinc-500 min-h-[180px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Dispatching Broadcast...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Update To All Attendees
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-heading">Recent Broadcasts</h2>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="glass-card p-8 text-center text-xs text-zinc-500">
              No previous updates logged. Send one to get started!
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-2 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold truncate max-w-[120px]">
                    {log.events?.title || "General Event"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                    {log.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white line-clamp-1">{log.subject}</h4>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-white/5">
                  <span>{log.recipient_count} recipients</span>
                  <span>{new Date(log.sent_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
