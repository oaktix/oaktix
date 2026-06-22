"use client";

import { useState, useCallback, useRef } from "react";
import {
  Mail, Send, Users, User, Search, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, Eye, EyeOff
} from "lucide-react";

type TargetGroup = "all" | "attendees" | "vendors" | "professionals" | "individual";

interface SearchUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

const GROUP_OPTIONS: { value: TargetGroup; label: string; description: string; icon: string }[] = [
  { value: "all", label: "Everyone", description: "All registered users", icon: "🌍" },
  { value: "attendees", label: "Attendees", description: "Users who buy tickets", icon: "🎟️" },
  { value: "vendors", label: "Organizers", description: "Event organizers & vendors", icon: "🏢" },
  { value: "professionals", label: "Professionals", description: "Approved service professionals", icon: "💼" },
  { value: "individual", label: "Individual", description: "Search by name or email", icon: "👤" },
];

export default function EmailCampaignsPage() {
  const [target, setTarget] = useState<TargetGroup>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Individual send state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setSelectedUser(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/users-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
      setSearchLoading(false);
    }, 350);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message body are required.");
      return;
    }
    if (target === "individual" && !selectedUser) {
      setError("Please search for and select a recipient.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload: Record<string, string> = { target, subject, body };
    if (target === "individual" && selectedUser) {
      payload.recipientEmail = selectedUser.email;
      payload.recipientName = selectedUser.full_name || selectedUser.email.split("@")[0];
    }

    try {
      const res = await fetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setResult(data);
      setSubject("");
      setBody("");
      setSelectedUser(null);
      setSearchQuery("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const previewHtml = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  const selectedGroup = GROUP_OPTIONS.find((g) => g.value === target)!;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2.5">
          <Mail className="w-8 h-8 text-indigo-500" /> Email Campaigns
        </h1>
        <p className="text-zinc-500 mt-1">
          Send branded OakTix emails to users by category or individual search.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Composer — spans 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSend} className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-5">

            {/* To — group selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> To
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GROUP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setTarget(opt.value); setSelectedUser(null); setSearchQuery(""); setSearchResults([]); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      target === opt.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-[#E8EBE7] bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <div>
                      <p className="text-xs font-bold leading-none">{opt.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual user search */}
            {target === "individual" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Search Recipient
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  {searchLoading && <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400 animate-spin" />}
                </div>

                {/* Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="border border-[#E8EBE7] rounded-xl overflow-hidden shadow-sm">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setSelectedUser(u); setSearchResults([]); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-[#E8EBE7] last:border-0 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-800">{u.full_name || "—"}</p>
                          <p className="text-xs text-zinc-500">{u.email}</p>
                        </div>
                        <span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase">{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                      {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-800 truncate">{selectedUser.full_name || "—"}</p>
                      <p className="text-xs text-emerald-600 truncate">{selectedUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                      className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Exciting events coming to your city!"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Message *</label>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-bold"
                >
                  {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {showPreview ? (
                <div
                  className="min-h-[160px] p-4 rounded-xl border border-[#E8EBE7] bg-zinc-50 text-sm text-zinc-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewHtml || "<span class='text-zinc-400'>No content yet...</span>" }}
                />
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here. The recipient will see a beautifully branded OakTix email with a reply button."
                  required
                  rows={7}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
                />
              )}
              <p className="text-[11px] text-zinc-400">
                Line breaks are preserved. Recipients will have a <strong>Reply to OakTix</strong> button linking to theoaktix@gmail.com.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {result && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <p className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Campaign sent successfully!
                </p>
                <p className="text-xs text-emerald-600">
                  <strong>{result.sent}</strong> emails delivered · <strong>{result.failed}</strong> failed · <strong>{result.total}</strong> total recipients
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/10"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Campaign to {selectedGroup.label}</>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar — info & tips (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Audience summary */}
          <div className="glass-card p-5 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" /> Audience Groups
            </h3>
            <div className="space-y-2">
              {GROUP_OPTIONS.filter((g) => g.value !== "individual").map((opt) => (
                <div key={opt.value} className="flex items-center gap-2.5">
                  <span className="text-base">{opt.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-zinc-700">{opt.label}</p>
                    <p className="text-[11px] text-zinc-400">{opt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email preview card */}
          <div className="glass-card p-5 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-3">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" /> How It Looks
            </h3>
            <div className="rounded-xl border border-[#E8EBE7] overflow-hidden bg-[#FAF9F6] p-3 text-center">
              <div className="bg-gradient-to-br from-[#0E4B31] to-[#1a6b47] rounded-lg p-4 mb-2 text-center">
                <p className="text-xl font-extrabold">
                  <span className="text-[#5fa589]">Oak</span><span className="text-[#F19E23]">Tix</span>
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">Nigeria's #1 Event Ticketing Platform</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-left space-y-2">
                <p className="text-xs font-bold text-zinc-800">{subject || "Your subject line here"}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-3">{body || "Your message preview will appear here..."}</p>
                <div className="pt-1">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0E4B31] to-[#1a6b47] text-white text-[11px] font-bold">
                    💬 Reply to OakTix
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="glass-card p-5 bg-indigo-50 border border-indigo-200 shadow-sm rounded-2xl">
            <h3 className="font-bold text-indigo-800 text-sm mb-3">📝 Best Practices</h3>
            <ul className="space-y-1.5 text-xs text-indigo-700">
              <li>• Keep subject lines concise (under 60 characters)</li>
              <li>• Address recipients personally (they get their name in the email)</li>
              <li>• Include a clear call-to-action</li>
              <li>• Avoid sending more than 1 campaign per week</li>
              <li>• Test with an individual send first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
