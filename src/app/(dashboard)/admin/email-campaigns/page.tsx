"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Mail, Send, Users, Search, Loader2, CheckCircle2, AlertCircle,
  Eye, EyeOff, X, UserPlus, Paperclip, Image as ImageIcon,
  FileText, BarChart2, Inbox, TrendingUp, RefreshCw, Trash2,
} from "lucide-react";

type TargetGroup = "all" | "attendees" | "vendors" | "professionals" | "individual";
type Tab = "compose" | "analytics";

interface SearchUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface AttachedFile {
  id: string;
  filename: string;
  content: string;  // base64
  content_type: string;
  inline: boolean;  // true = image embedded in body; false = document attachment
  previewUrl?: string; // for images only
  size: number;
}

interface CampaignRecord {
  id: string;
  subject: string;
  target: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  open_count: number;
  open_rate: number;
  created_at: string;
}

const GROUP_OPTIONS: { value: TargetGroup; label: string; description: string; icon: string }[] = [
  { value: "all", label: "Everyone", description: "All registered users", icon: "🌍" },
  { value: "attendees", label: "Attendees", description: "Users who buy tickets", icon: "🎟️" },
  { value: "vendors", label: "Organizers", description: "Event organizers & vendors", icon: "🏢" },
  { value: "professionals", label: "Professionals", description: "Approved service pros", icon: "💼" },
  { value: "individual", label: "Individuals", description: "Select specific users", icon: "👤" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function targetLabel(t: string) {
  return GROUP_OPTIONS.find((g) => g.value === t)?.label ?? t;
}

export default function EmailCampaignsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("compose");

  // Compose state
  const [target, setTarget] = useState<TargetGroup>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Attachments
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-individual selection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Analytics state
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);

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

  const removeUser = (userId: string) => setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));

  // File attachment handler
  const handleFileAttach = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB per file

    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is too large (max 10 MB).`);
        continue;
      }
      const isImage = file.type.startsWith("image/");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix — only pass raw base64 to the API
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newFile: AttachedFile = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        filename: file.name,
        content: base64,
        content_type: file.type,
        inline: isImage,
        size: file.size,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
      setAttachedFiles((prev) => [...prev, newFile]);
    }
  }, []);

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const toggleInline = (id: string) => {
    setAttachedFiles((prev) => prev.map((f) => f.id === id ? { ...f, inline: !f.inline } : f));
  };

  // Analytics loader
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/campaign-analytics");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setMigrationNeeded(data.migrationNeeded === true);
    } catch {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "analytics") loadAnalytics();
  }, [activeTab, loadAnalytics]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { setError("Subject and message body are required."); return; }
    if (target === "individual" && selectedUsers.length === 0) { setError("Please add at least one recipient."); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload: Record<string, unknown> = {
      target,
      subject,
      body,
      attachments: attachedFiles.map((f) => ({
        filename: f.filename,
        content: f.content,
        content_type: f.content_type,
        inline: f.inline,
      })),
    };

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
      setAttachedFiles([]);
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
  const filteredResults = searchResults.filter((r) => !selectedUsers.find((s) => s.id === r.id));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2.5">
            <Mail className="w-8 h-8 text-indigo-500" /> Email Campaigns
          </h1>
          <p className="text-zinc-500 mt-1">Send branded OakTix emails and track open rates.</p>
        </div>
        {/* Tab switcher */}
        <div className="flex rounded-xl border border-[#E8EBE7] overflow-hidden bg-white shadow-sm">
          {(["compose", "analytics"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-indigo-500 text-white"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {tab === "compose" ? <Send className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
              {tab === "compose" ? "Compose" : "Analytics"}
            </button>
          ))}
        </div>
      </div>

      {/* ──── COMPOSE TAB ──── */}
      {activeTab === "compose" && (
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
                    <button key={opt.value} type="button"
                      onClick={() => { setTarget(opt.value); if (opt.value !== "individual") { setSelectedUsers([]); setSearchQuery(""); setSearchResults([]); } }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${target === opt.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-[#E8EBE7] bg-white text-zinc-600 hover:border-zinc-300"}`}>
                      <span className="text-base">{opt.icon}</span>
                      <div>
                        <p className="text-xs font-bold leading-none">{opt.label}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-individual picker */}
              {target === "individual" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Search & Add Recipients
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                    <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                    {searchLoading && <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400 animate-spin" />}
                  </div>

                  {filteredResults.length > 0 && (
                    <div className="border border-[#E8EBE7] rounded-xl overflow-hidden shadow-sm">
                      {filteredResults.map((u) => (
                        <button key={u.id} type="button" onClick={() => addUser(u)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-[#E8EBE7] last:border-0 text-left">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                            {(u.full_name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-800 truncate">{u.full_name || "—"}</p>
                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">{u.role}</span>
                            <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white"><UserPlus className="w-3 h-3" /></span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedUsers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide">{selectedUsers.length} recipient{selectedUsers.length !== 1 ? "s" : ""} selected</p>
                      <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 min-h-[48px]">
                        {selectedUsers.map((u) => (
                          <span key={u.id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-indigo-700 shadow-sm">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[9px] flex-shrink-0">{(u.full_name || u.email).charAt(0).toUpperCase()}</span>
                            <span className="max-w-[120px] truncate">{u.full_name || u.email.split("@")[0]}</span>
                            <button type="button" onClick={() => removeUser(u.id)} className="w-4 h-4 rounded-full bg-indigo-100 hover:bg-red-100 flex items-center justify-center text-indigo-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                        {selectedUsers.length > 1 && (
                          <button type="button" onClick={() => setSelectedUsers([])} className="text-[10px] text-red-400 hover:text-red-600 font-bold self-center ml-auto">Clear all</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Subject *</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required
                  placeholder="e.g. Exciting events coming to your city!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Message *</label>
                  <button type="button" onClick={() => setShowPreview((v) => !v)}
                    className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-bold">
                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPreview ? "Edit" : "Preview"}
                  </button>
                </div>
                {showPreview ? (
                  <div className="min-h-[160px] p-4 rounded-xl border border-[#E8EBE7] bg-zinc-50 text-sm text-zinc-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: previewHtml || "<span class='text-zinc-400'>No content yet...</span>" }} />
                ) : (
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={7}
                    placeholder="Write your message here. Recipients get a branded OakTix email with a reply button."
                    className="w-full px-3.5 py-3 rounded-xl border border-[#E8EBE7] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed" />
                )}
              </div>

              {/* ── Attachments section ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> Attachments
                    <span className="text-zinc-400 normal-case font-normal">(images inline · docs attached)</span>
                  </label>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors">
                    <Paperclip className="w-3.5 h-3.5" /> Add file
                  </button>
                </div>
                <input ref={fileInputRef} type="file" multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  className="sr-only"
                  onChange={(e) => handleFileAttach(e.target.files)} />

                {attachedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E8EBE7] bg-zinc-50/50">
                        {file.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={file.previewUrl} alt={file.filename}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-zinc-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-700 truncate">{file.filename}</p>
                          <p className="text-[10px] text-zinc-400">{formatBytes(file.size)}</p>
                        </div>
                        {file.content_type.startsWith("image/") && (
                          <button type="button" onClick={() => toggleInline(file.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              file.inline
                                ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                            }`}
                            title={file.inline ? "Shown in email body" : "Sent as attachment"}>
                            {file.inline ? <><ImageIcon className="w-3 h-3" /> Inline</> : <><Paperclip className="w-3 h-3" /> Attach</>}
                          </button>
                        )}
                        <button type="button" onClick={() => removeFile(file.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-[#E8EBE7] text-xs text-zinc-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors text-center">
                    Click to add images or documents · Max 10 MB each
                  </button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              {result && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <p className="flex items-center gap-2 font-bold text-emerald-700 text-sm"><CheckCircle2 className="w-5 h-5" /> Campaign sent!</p>
                  <p className="text-xs text-emerald-600"><strong>{result.sent}</strong> delivered · <strong>{result.failed}</strong> failed · <strong>{result.total}</strong> total</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/10">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>) :
                  target === "individual" ? (
                    <><Send className="w-4 h-4" /> Send to {selectedUsers.length || 0} Recipient{selectedUsers.length !== 1 ? "s" : ""}</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send to {selectedGroup.label}</>
                  )}
              </button>
            </form>
          </div>

          {/* Sidebar — 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-card p-5 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-500" /> Email Preview</h3>
              <div className="rounded-xl border border-[#E8EBE7] overflow-hidden bg-[#FAF9F6] p-3 text-center">
                <div className="bg-gradient-to-br from-[#0E4B31] to-[#1a6b47] rounded-lg p-4 mb-2 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-header.png" alt="OakTix" className="h-8 w-auto mx-auto object-contain" />
                  <p className="text-[10px] text-white/60 mt-1.5">Nigeria&apos;s #1 Event Ticketing Platform</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-left space-y-2">
                  <p className="text-xs font-bold text-zinc-800">{subject || "Your subject line here"}</p>
                  <p className="text-[11px] text-zinc-500 line-clamp-3">{body || "Your message..."}</p>
                  {attachedFiles.filter((f) => f.inline).length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-1">
                      {attachedFiles.filter((f) => f.inline).map((f) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={f.id} src={f.previewUrl} alt={f.filename}
                          className="h-12 w-12 rounded object-cover border border-zinc-100" />
                      ))}
                    </div>
                  )}
                  {attachedFiles.filter((f) => !f.inline).length > 0 && (
                    <p className="text-[10px] text-zinc-400 border-t pt-1">
                      📎 {attachedFiles.filter((f) => !f.inline).length} document{attachedFiles.filter((f) => !f.inline).length !== 1 ? "s" : ""} attached
                    </p>
                  )}
                  <div className="pt-1">
                    <span className="inline-block px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0E4B31] to-[#1a6b47] text-white text-[11px] font-bold">💬 Reply to OakTix</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 bg-indigo-50 border border-indigo-200 shadow-sm rounded-2xl">
              <h3 className="font-bold text-indigo-800 text-sm mb-3">📎 Attachment Guide</h3>
              <ul className="space-y-1.5 text-xs text-indigo-700">
                <li>• <strong>Images</strong> — appear directly in the email body (inline)</li>
                <li>• Use the toggle to switch an image between inline and attached</li>
                <li>• <strong>PDFs / Docs</strong> — always sent as downloadable attachments</li>
                <li>• Max 10 MB per file</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ──── ANALYTICS TAB ──── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Campaign history with open tracking.</p>
            <button onClick={loadAnalytics} disabled={analyticsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8EBE7] bg-white text-xs font-bold text-zinc-500 hover:text-indigo-500 hover:border-indigo-300 transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {migrationNeeded && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 space-y-1">
              <p className="font-bold">⚙️ Migration required</p>
              <p>Run the email analytics migration to enable campaign tracking: <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">20260622_email_campaign_analytics.sql</code></p>
            </div>
          )}

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-zinc-200 mb-3" />
              <p className="font-bold text-zinc-400">No campaigns sent yet</p>
              <p className="text-sm text-zinc-300 mt-1">Send your first campaign to see analytics here.</p>
              <button onClick={() => setActiveTab("compose")} className="mt-4 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all">Compose Campaign</button>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Campaigns", value: campaigns.length, icon: "📧" },
                  { label: "Total Sent", value: campaigns.reduce((s, c) => s + c.sent_count, 0).toLocaleString(), icon: "✉️" },
                  { label: "Total Opens", value: campaigns.reduce((s, c) => s + c.open_count, 0).toLocaleString(), icon: "👁" },
                  {
                    label: "Avg Open Rate",
                    value: (() => {
                      const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0);
                      const totalOpens = campaigns.reduce((s, c) => s + c.open_count, 0);
                      return totalSent > 0 ? `${Math.round((totalOpens / totalSent) * 100)}%` : "—";
                    })(),
                    icon: "📈",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card p-4 bg-white border border-[#E8EBE7] rounded-2xl shadow-sm">
                    <p className="text-xl mb-0.5">{stat.icon}</p>
                    <p className="text-xl font-bold text-zinc-900">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Campaigns table */}
              <div className="glass-card bg-white border border-[#E8EBE7] rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E8EBE7] bg-zinc-50/60">
                        <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Subject</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Audience</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Sent</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Opens</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Open Rate</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => (
                        <tr key={c.id} className="border-b border-[#E8EBE7] last:border-0 hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-zinc-800 max-w-[200px] truncate">{c.subject}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                              {GROUP_OPTIONS.find((g) => g.value === c.target)?.icon} {targetLabel(c.target)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-700 font-semibold">{c.sent_count.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-zinc-700 font-semibold">{c.open_count.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 font-bold text-xs ${c.open_rate >= 20 ? "text-emerald-600" : c.open_rate >= 10 ? "text-amber-600" : "text-zinc-400"}`}>
                              <TrendingUp className="w-3 h-3" /> {c.open_rate}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-zinc-400">
                            {new Date(c.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
