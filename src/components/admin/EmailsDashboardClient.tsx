"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Mail, 
  Send, 
  Download, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  User, 
  Eye, 
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

interface EmailMetadata {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  created_at: string;
  status?: string;
  last_event?: string;
}

interface EmailDetail extends EmailMetadata {
  html?: string | null;
  text?: string | null;
}

export default function EmailsDashboardClient() {
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [emails, setEmails] = useState<EmailMetadata[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Pagination cursors
  const [afterCursor, setAfterCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchEmails = useCallback(async (cursor?: string) => {
    setLoadingList(true);
    setErrorMsg(null);
    try {
      const url = new URL("/api/admin/emails", window.location.origin);
      url.searchParams.set("type", activeTab);
      url.searchParams.set("limit", "20");
      if (cursor) {
        url.searchParams.set("after", cursor);
      }

      const res = await fetch(url.toString());
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to load emails.");
      }

      const listData = resData.data?.data || [];
      setEmails(listData);
      
      // Update cursor for pagination
      if (listData.length > 0) {
        const lastEmail = listData[listData.length - 1];
        setAfterCursor(lastEmail.id);
      } else {
        setAfterCursor(undefined);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load emails.";
      setErrorMsg(msg);
    } finally {
      setLoadingList(false);
    }
  }, [activeTab]);

  // Load emails list on mount or tab change
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedEmailId(null);
      setSelectedEmail(null);
      setCurrentPage(0);
      setCursorHistory([undefined]);
      fetchEmails();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchEmails]);

  // Load selected email details
  const fetchEmailDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const url = new URL("/api/admin/emails", window.location.origin);
      url.searchParams.set("id", id);
      url.searchParams.set("type", activeTab);

      const res = await fetch(url.toString());
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to load email details.");
      }

      setSelectedEmail(resData.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load details.";
      setDetailError(msg);
    } finally {
      setLoadingDetail(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedEmailId) {
      const timer = setTimeout(() => {
        fetchEmailDetail(selectedEmailId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedEmailId, fetchEmailDetail]);

  const handleNextPage = () => {
    if (afterCursor) {
      const nextHistory = [...cursorHistory, afterCursor];
      setCursorHistory(nextHistory);
      setCurrentPage((prev) => prev + 1);
      fetchEmails(afterCursor);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const prevCursor = cursorHistory[currentPage - 1];
      setCurrentPage((prev) => prev - 1);
      const nextHistory = cursorHistory.slice(0, currentPage);
      setCursorHistory(nextHistory);
      fetchEmails(prevCursor);
    }
  };

  // Filter emails client-side for search query
  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    const query = searchQuery.toLowerCase().trim();
    return emails.filter((email) => {
      const recipients = Array.isArray(email.to) ? email.to.join(" ") : email.to || "";
      return (
        email.subject?.toLowerCase().includes(query) ||
        email.from?.toLowerCase().includes(query) ||
        recipients.toLowerCase().includes(query) ||
        email.id?.toLowerCase().includes(query)
      );
    });
  }, [emails, searchQuery]);

  function getStatusIcon(status?: string, lastEvent?: string) {
    const curStatus = lastEvent || status || "sent";
    switch (curStatus.toLowerCase()) {
      case "delivered":
      case "sent":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "bounced":
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case "opened":
      case "clicked":
        return <Eye className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  }

  function getStatusClass(status?: string, lastEvent?: string) {
    const curStatus = lastEvent || status || "sent";
    switch (curStatus.toLowerCase()) {
      case "delivered":
      case "sent":
        return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
      case "bounced":
      case "failed":
        return "bg-rose-500/10 border border-rose-500/20 text-rose-400";
      case "opened":
      case "clicked":
        return "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400";
      default:
        return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center gap-3">
            System Mail Logs
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold uppercase tracking-wider">
              Resend Integrations
            </span>
          </h1>
          <p className="text-zinc-500 text-sm">Monitor platform-wide transactional, OTP, and marketing email dispatches.</p>
        </div>
        <button
          onClick={() => fetchEmails(cursorHistory[currentPage])}
          disabled={loadingList}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-zinc-300 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl max-w-sm w-full">
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "sent" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Outgoing (Sent)
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "received" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Inbound (Received)
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search subject, emails, or email ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-500 text-zinc-200 transition-colors"
          />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Side: Emails List */}
        <div className="lg:col-span-5 glass-card p-4 flex flex-col justify-between border-white/10 bg-transparent h-[680px]">
          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-zinc-500 font-medium">Fetching Resend mail indexes...</p>
              </div>
            ) : errorMsg ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-red-400">Failed to load mail logs</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">{errorMsg}</p>
                <button
                  onClick={() => fetchEmails()}
                  className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-lg transition-colors text-white"
                >
                  Retry
                </button>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <Mail className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
                <p className="text-sm font-bold text-zinc-300">No emails found</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  {searchQuery ? "No matches found for your search query." : "No emails recorded in Resend logs for this type."}
                </p>
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                const formattedDate = new Date(email.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const toField = Array.isArray(email.to) ? email.to.join(", ") : email.to;

                return (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-600/5 text-white" 
                        : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className={`text-xs font-mono truncate max-w-[200px] ${isSelected ? "text-indigo-300" : "text-zinc-500"}`}>
                        {email.id}
                      </p>
                      <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold line-clamp-1 mb-2 font-heading leading-snug">
                      {email.subject || "(No Subject)"}
                    </h4>

                    <div className="flex items-center justify-between gap-3 mt-1.5 pt-2 border-t border-white/5">
                      <span className="text-xs truncate max-w-[220px] font-medium text-zinc-400">
                        {activeTab === "sent" ? `To: ${toField}` : `From: ${email.from}`}
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusClass(email.status, email.last_event)}`}>
                        {getStatusIcon(email.status, email.last_event)}
                        <span className="ml-0.5">{email.last_event || email.status || "sent"}</span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Left Side: Pagination */}
          {emails.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
              <span className="text-xs text-zinc-500">
                Page <span className="font-bold text-zinc-300">{currentPage + 1}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0 || loadingList}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-50 transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!afterCursor || loadingList}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-50 transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Detailed View */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col border-white/10 bg-transparent h-[680px]">
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-sm text-zinc-500 font-medium">Downloading full HTML document...</p>
            </div>
          ) : detailError ? (
            <div className="flex flex-col items-center justify-center text-center h-full max-w-sm mx-auto">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <p className="text-base font-bold text-rose-400">Failed to render email contents</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{detailError}</p>
              <button
                onClick={() => selectedEmailId && fetchEmailDetail(selectedEmailId)}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-xl transition-all text-white"
              >
                Retry Download
              </button>
            </div>
          ) : selectedEmail ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Header Info */}
              <div className="space-y-4 border-b border-white/10 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold font-heading text-zinc-100 leading-snug">
                    {selectedEmail.subject || "(No Subject)"}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusClass(selectedEmail.status, selectedEmail.last_event)}`}>
                    {getStatusIcon(selectedEmail.status, selectedEmail.last_event)}
                    <span>{selectedEmail.last_event || selectedEmail.status || "sent"}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 bg-white/5 border border-white/5 p-3 rounded-xl">
                    <p className="text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-400" /> Sender</p>
                    <p className="text-zinc-200 font-mono select-all truncate">{selectedEmail.from}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 border border-white/5 p-3 rounded-xl">
                    <p className="text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-1"><User className="w-3.5 h-3.5 text-emerald-400" /> Recipient</p>
                    <p className="text-zinc-200 font-mono select-all truncate">
                      {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(", ") : selectedEmail.to}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs gap-3 text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {new Date(selectedEmail.created_at).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    })}
                  </span>
                  <span className="font-mono text-zinc-500">ID: {selectedEmail.id}</span>
                </div>
              </div>

              {/* Email Content Frame */}
              <div className="flex-1 min-h-[300px] border border-white/10 rounded-2xl overflow-hidden bg-white relative">
                {selectedEmail.html ? (
                  <iframe
                    title="Email Render Preview"
                    srcDoc={selectedEmail.html}
                    className="w-full h-full border-none bg-white"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                  />
                ) : selectedEmail.text ? (
                  <div className="w-full h-full overflow-auto p-6 text-zinc-800 font-mono text-sm whitespace-pre-wrap select-all">
                    {selectedEmail.text}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs">
                    <FileText className="w-8 h-8 text-zinc-400 mb-2 animate-bounce" />
                    Empty body payload recorded.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-4 shadow-inner shadow-black">
                <Mail className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-base font-bold text-zinc-300">No email selected</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                Click on any email from the log indexes on the left to read its full HTML newsletter layout, dispatch headers, and recipient tracking info.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
