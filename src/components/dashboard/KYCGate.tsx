"use client";

import { useState, useRef } from "react";
import { ShieldCheck, Loader2, Upload, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type KYCStatus = "none" | "pending" | "approved" | "rejected";

interface KYCData {
  status: KYCStatus;
  type?: string;
  submitted_at?: string;
  rejection_reason?: string;
}

interface KYCGateProps {
  kycData: KYCData | null;
  children: React.ReactNode;
}

const DOC_TYPES = [
  { value: "nin", label: "NIN (National Identification Number)", isText: true },
  { value: "nin_slip", label: "NIN Slip", isText: false },
  { value: "voters_card", label: "Voter's Card", isText: false },
  { value: "drivers_license", label: "Driver's License", isText: false },
  { value: "passport", label: "International Passport", isText: false },
] as const;

type DocType = (typeof DOC_TYPES)[number]["value"];

export default function KYCGate({ kycData, children }: KYCGateProps) {
  const status: KYCStatus = kycData?.status ?? "none";

  // If KYC is approved, render the children (WithdrawalForm, etc.)
  if (status === "approved") {
    return <>{children}</>;
  }

  // If KYC is pending, show waiting screen
  if (status === "pending") {
    return (
      <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="font-bold text-sm text-zinc-900">Identity Verification Pending</p>
            <p className="text-xs text-zinc-500">Your KYC document is under review by our team.</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
          <p className="font-bold mb-1">⏳ Review in progress</p>
          <p>Your <strong>{DOC_TYPES.find(d => d.value === kycData?.type)?.label ?? kycData?.type}</strong> was submitted on {kycData?.submitted_at ? new Date(kycData.submitted_at).toLocaleDateString("en-NG") : "—"}.</p>
          <p className="mt-1">You will receive an email once verification is complete. This usually takes 1–2 business days.</p>
        </div>
      </div>
    );
  }

  // If rejected, show message + allow resubmission
  if (status === "rejected") {
    return (
      <div className="space-y-4">
        <div className="glass-card p-6 bg-white border border-red-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-sm text-zinc-900">Verification Not Approved</p>
              {kycData?.rejection_reason && (
                <p className="text-xs text-red-600">{kycData.rejection_reason}</p>
              )}
            </div>
          </div>
        </div>
        <KYCSubmissionForm resubmit />
      </div>
    );
  }

  // Default: no KYC submitted yet
  return <KYCSubmissionForm />;
}

function KYCSubmissionForm({ resubmit = false }: { resubmit?: boolean }) {
  const [docType, setDocType] = useState<DocType>("nin");
  const [ninValue, setNinValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedDoc = DOC_TYPES.find((d) => d.value === docType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("type", docType);

    if (selectedDoc.isText) {
      if (!ninValue.trim()) {
        setError("Please enter your NIN number.");
        setLoading(false);
        return;
      }
      fd.append("nin", ninValue.trim());
    } else {
      if (!file) {
        setError("Please upload your document image.");
        setLoading(false);
        return;
      }
      fd.append("document", file);
    }

    try {
      const res = await fetch("/api/organizer/kyc", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          <p className="font-bold text-zinc-900">KYC Submitted!</p>
          <p className="text-sm text-zinc-500 max-w-xs">
            Your identity document has been submitted for review. You'll receive an email within 1–2 business days once verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <p className="font-bold text-sm text-zinc-900">Identity Verification Required</p>
          <p className="text-xs text-zinc-500">Complete KYC before your first withdrawal.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs leading-relaxed">
        <p className="font-bold mb-1">🔒 Why is this required?</p>
        <p>To protect all organizers and comply with financial regulations, we verify your identity before processing withdrawals. This is a one-time process.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document type selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
            Select ID Type
          </label>
          <div className="grid grid-cols-1 gap-2">
            {DOC_TYPES.map((dt) => (
              <label
                key={dt.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  docType === dt.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-[#E8EBE7] bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="docType"
                  value={dt.value}
                  checked={docType === dt.value}
                  onChange={() => setDocType(dt.value)}
                  className="accent-indigo-500"
                />
                <span className="text-sm font-medium">{dt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* NIN text input */}
        {selectedDoc.isText ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">NIN Number</label>
            <input
              type="text"
              value={ninValue}
              onChange={(e) => setNinValue(e.target.value)}
              placeholder="e.g. 12345678901"
              maxLength={11}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        ) : (
          /* File upload */
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
              Upload Document Image
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                file ? "border-indigo-400 bg-indigo-50" : "border-[#E8EBE7] hover:border-zinc-300"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <FileText className="w-8 h-8 text-indigo-500" />
                  <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                  <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-zinc-300" />
                  <p className="text-sm text-zinc-500">Click to upload image or PDF</p>
                  <p className="text-xs text-zinc-400">JPG, PNG, or PDF · max 5 MB</p>
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-xs font-semibold">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><ShieldCheck className="w-4 h-4" /> {resubmit ? "Resubmit Verification" : "Submit Verification"}</>
          )}
        </button>
      </form>
    </div>
  );
}
