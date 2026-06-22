"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle, XCircle, Clock, FileText, ExternalLink } from "lucide-react";

interface KYCRecord {
  id: string;
  full_name: string;
  email: string;
  kyc: {
    status: "pending" | "approved" | "rejected";
    type: string;
    submitted_at: string;
    nin?: string;
    document_url?: string;
    rejection_reason?: string;
  };
}

const DOC_LABELS: Record<string, string> = {
  nin: "NIN (National ID)",
  nin_slip: "NIN Slip",
  voters_card: "Voter's Card",
  drivers_license: "Driver's License",
  passport: "International Passport",
};

export default function AdminKYCPage() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchRecords = async () => {
    const res = await fetch("/api/admin/kyc");
    const data = await res.json();
    setRecords(data.vendors || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAction = async (vendorId: string, action: "approve" | "reject", reason?: string) => {
    setProcessingId(vendorId);
    await fetch("/api/admin/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, action, reason }),
    });
    setProcessingId(null);
    setRejectingId(null);
    setRejectReason("");
    await fetchRecords();
  };

  const pending = records.filter((r) => r.kyc.status === "pending");
  const reviewed = records.filter((r) => r.kyc.status !== "pending");

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2.5">
          <ShieldCheck className="w-8 h-8 text-indigo-500" /> KYC Verification
        </h1>
        <p className="text-zinc-500 mt-1">Review and approve organizer identity documents.</p>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading KYC submissions...</p>
      ) : (
        <>
          {/* Pending */}
          <section>
            <h2 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Review
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pending.length}</span>
            </h2>

            {pending.length === 0 ? (
              <div className="glass-card p-8 bg-white border border-[#E8EBE7] text-center rounded-2xl">
                <ShieldCheck className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 font-medium">No pending KYC submissions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((r) => (
                  <KYCCard
                    key={r.id}
                    record={r}
                    processingId={processingId}
                    rejectingId={rejectingId}
                    rejectReason={rejectReason}
                    setRejectingId={setRejectingId}
                    setRejectReason={setRejectReason}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <section>
              <h2 className="text-lg font-bold font-heading mb-4">Reviewed</h2>
              <div className="space-y-3">
                {reviewed.map((r) => (
                  <KYCCard
                    key={r.id}
                    record={r}
                    processingId={processingId}
                    rejectingId={rejectingId}
                    rejectReason={rejectReason}
                    setRejectingId={setRejectingId}
                    setRejectReason={setRejectReason}
                    onAction={handleAction}
                    readonly
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function KYCCard({
  record,
  processingId,
  rejectingId,
  rejectReason,
  setRejectingId,
  setRejectReason,
  onAction,
  readonly = false,
}: {
  record: KYCRecord;
  processingId: string | null;
  rejectingId: string | null;
  rejectReason: string;
  setRejectingId: (id: string | null) => void;
  setRejectReason: (v: string) => void;
  onAction: (id: string, action: "approve" | "reject", reason?: string) => Promise<void>;
  readonly?: boolean;
}) {
  const { id, full_name, email, kyc } = record;
  const isLoading = processingId === id;

  return (
    <div className="glass-card p-5 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-bold text-zinc-900">{full_name || "Unknown Organizer"}</p>
          <p className="text-xs text-zinc-500">{email}</p>
          <p className="text-xs text-zinc-400 mt-1">
            Submitted: {new Date(kyc.submitted_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
          </p>
        </div>
        <StatusBadge status={kyc.status} />
      </div>

      <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-[#E8EBE7] rounded-xl text-sm text-zinc-600">
        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span className="font-medium">{DOC_LABELS[kyc.type] ?? kyc.type}</span>
        {kyc.nin && <span className="ml-2 font-mono text-xs bg-zinc-200 px-2 py-0.5 rounded">{kyc.nin}</span>}
        {kyc.document_url && (
          <a
            href={kyc.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-xs font-bold"
          >
            View Document <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {kyc.rejection_reason && (
        <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          Rejection reason: {kyc.rejection_reason}
        </p>
      )}

      {!readonly && kyc.status === "pending" && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAction(id, "approve")}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> Approve
          </button>

          {rejectingId === id ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (optional)"
                className="flex-1 px-3 py-2 rounded-xl border border-red-200 text-sm focus:outline-none focus:border-red-400"
              />
              <button
                onClick={() => onAction(id, "reject", rejectReason)}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-zinc-500 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setRejectingId(id)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
  if (status === "rejected")
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 border border-red-200 text-red-700"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700"><Clock className="w-3.5 h-3.5" /> Pending</span>;
}
