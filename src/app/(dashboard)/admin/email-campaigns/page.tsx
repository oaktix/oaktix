"use client";

import { useState, useCallback, useRef } from "react";
import {
  Mail, Send, Users, Search, Loader2, CheckCircle2,
  AlertCircle, Eye, EyeOff, X, UserPlus
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
  { value: "professionals", label: "Professionals", description: "Approved service pros", icon: "💼" },
  { value: "individual", label: "Individuals", description: "Select specific users", icon: "👤" },
];

export default function EmailCampaignsPage() {
  const [target, setTarget] = useState<TargetGroup>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Multi-individual selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
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

  const addUser = (user: SearchUser) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message body are required.");
      return;
    }
    if (target === "individual" && selectedUsers.length === 0) {
      setError("Please add at least one recipient.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload: Record<string, unknown> = { target, subject, body };
    if (target === "individual") {
      payload.recipients = selectedUsers.map((u) => ({
        email: u.email,
        name: u.full_name || u.email.split("@")[0],
      }));
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
      setSelectedUsers([]);
      setSearchQuery("");
    } catch (err: unknown) {
      setError((err as Error).message || "Something went wrong.");
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

  // Users already selected — filter them out of search results
  const filteredResults = searchResults.filter(
    (r) => !selectedUsers.find((s) => s.id === r.id)
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2.5">
          <Mail className="w-8 h-8 text-indigo-500" /> Email Campaigns
        </h1>
        <p className="text-zinc-500 mt-1">
          Send branded OakTix emails to user categories or individual recipients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Composer — 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSend} className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-5">

            {/* Audience selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> To
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GROUP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTarget(opt.value);
                      if (opt.value !== "individual") {
                        setSelectedUsers([]);
                        setSearchQuery("");
                        setSearchResults([]);
                      }
                    }}
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

            {/* Multi-individual recipient picker */}
            {target === "individual" && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Search & Add Recipients
                </label>

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400 animate-spin" />
                  )}
                </div>

                {/* Search dropdown results */}
                {filteredResults.length > 0 && (
                  <div className="border border-[#E8EBE7] rounded-xl overflow-hidden shadow-sm">
                    {filteredResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addUser(u)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-[#E8EBE7] last:border-0 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 truncate">{u.full_name || "—"}</p>
                          <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{u.role}</span>
                          <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                            <UserPlus className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected recipients chips */}
                {selectedUsers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide">
                      {selectedUsers.length} recipient{selectedUsers.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 min-h-[48px]">
                      {selectedUsers.map((u) => (
                        <span
                          key={u.id}
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-indigo-700 shadow-sm"
                        >
                          <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[9px] flex-shrink-0">
                            {(u.full_name || u.email).charAt(0).toUpperCase()}
                          </span>
                          <span className="max-w-[120px] truncate">
                            {u.full_name || u.email.split("@")[0]}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeUser(u.id)}
                            className="w-4 h-4 rounded-full bg-indigo-100 hover:bg-red-100 flex items-center justify-center text-indigo-400 hover:text-red-500 transition-colors flex-shrink-0"
                            aria-label={`Remove ${u.full_name || u.email}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      {selectedUsers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSelectedUsers([])}
                          className="text-[10px] text-red-400 hover:text-red-600 font-bold self-center ml-auto"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {selectedUsers.length === 0 && !searchQuery && (
                  <p className="text-xs text-zinc-400 text-center py-2">
                    Start typing a name or email to add recipients
                  </p>
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
                  dangerouslySetInnerHTML={{
                    __html: previewHtml || "<span class='text-zinc-400'>No content yet...</span>",
                  }}
                />
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here. Recipients will see a beautifully branded OakTix email with a reply button."
                  required
                  rows={7}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
                />
              )}
              <p className="text-[11px] text-zinc-400">
                Line breaks preserved. Recipients get a <strong>Reply to OakTix</strong> button.
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
                  <strong>{result.sent}</strong> delivered · <strong>{result.failed}</strong> failed ·{" "}
                  <strong>{result.total}</strong> total
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : target === "individual" ? (
                <>
                  <Send className="w-4 h-4" />
                  Send to {selectedUsers.length || 0} Recipient{selectedUsers.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send to {selectedGroup.label}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar — 2 cols */}
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
              <div className="flex items-center gap-2.5 pt-1 border-t border-[#E8EBE7]">
                <span className="text-base">👤</span>
                <div>
                  <p className="text-xs font-bold text-zinc-700">Individuals</p>
                  <p className="text-[11px] text-zinc-400">Search & add multiple specific users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email mini-preview */}
          <div className="glass-card p-5 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-3">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" /> How It Looks
            </h3>
            <div className="rounded-xl border border-[#E8EBE7] overflow-hidden bg-[#FAF9F6] p-3 text-center">
              <div className="bg-gradient-to-br from-[#0E4B31] to-[#1a6b47] rounded-lg p-4 mb-2 text-center">
                <p className="text-xl font-extrabold">
                  <span className="text-[#5fa589]">Oak</span>
                  <span className="text-[#F19E23]">Tix</span>
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">Nigeria&apos;s #1 Event Ticketing Platform</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-left space-y-2">
                <p className="text-xs font-bold text-zinc-800">{subject || "Your subject line here"}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-3">
                  {body || "Your message preview will appear here..."}
                </p>
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
              <li>• Keep subject lines under 60 characters</li>
              <li>• Recipients get their name personalised in the email</li>
              <li>• For individuals, add as many users as needed before sending</li>
              <li>• Test with a single individual send first</li>
              <li>• Avoid sending more than 1 campaign per week</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
