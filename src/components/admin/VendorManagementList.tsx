"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, CheckCircle, Clock, User, Phone, Mail, Award } from "lucide-react";

interface VendorProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  vendor_details?: {
    business_name?: string;
    verified?: boolean;
    tax_id?: string;
    bio?: string;
  };
  created_at: string;
}

interface VendorManagementProps {
  initialVendors: VendorProfile[];
}

export default function VendorManagementList({ initialVendors }: VendorManagementProps) {
  const [vendors, setVendors] = useState<VendorProfile[]>(initialVendors);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter vendors based on search input
  const filteredVendors = vendors.filter((v) => {
    const name = v.full_name?.toLowerCase() || "";
    const email = v.email?.toLowerCase() || "";
    const bizName = v.vendor_details?.business_name?.toLowerCase() || "";
    const term = search.toLowerCase();
    return name.includes(term) || email.includes(term) || bizName.includes(term);
  });

  const handleVerify = async (vendorId: string, currentStatus: boolean) => {
    setLoadingId(vendorId);
    setError(null);

    try {
      const response = await fetch("/api/admin/vendors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, verified: !currentStatus }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update vendor status");

      // Update state local list
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendorId
            ? {
                ...v,
                vendor_details: {
                  ...(v.vendor_details || {}),
                  verified: !currentStatus,
                },
              }
            : v
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error verifying vendor");
    } finally {
      setLoadingId(null);
    }
  };

  const total = vendors.length;
  const verifiedCount = vendors.filter((v) => v.vendor_details?.verified).length;
  const pendingCount = total - verifiedCount;

  return (
    <div className="space-y-6">
      {/* Diagnostics / Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Vendors</p>
            <p className="text-3xl font-bold font-heading text-white">{total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Verified Partners</p>
            <p className="text-3xl font-bold font-heading text-emerald-400">{verifiedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Pending Verification</p>
            <p className="text-3xl font-bold font-heading text-amber-500">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filtering Header & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-zinc-900/20 border border-zinc-850 p-4 rounded-2xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search vendors by name, email, or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Vendors Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-850 bg-black/20 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900/40">
              <th className="px-6 py-4">Business & Bio</th>
              <th className="px-6 py-4">Account Owner</th>
              <th className="px-6 py-4">Contact Info</th>
              <th className="px-6 py-4 text-center">Verification Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-sm">
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium bg-zinc-950/20">
                  No registered vendors found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => {
                const isVerified = !!vendor.vendor_details?.verified;
                const bizName = vendor.vendor_details?.business_name || "Unspecified Business";
                const taxId = vendor.vendor_details?.tax_id || "No Tax ID";
                const bio = vendor.vendor_details?.bio || "No business biography provided yet.";

                return (
                  <tr key={vendor.id} className="hover:bg-zinc-900/20 transition-all duration-150">
                    <td className="px-6 py-5 max-w-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-100 text-base">{bizName}</span>
                          {isVerified && <Award className="w-4.5 h-4.5 text-indigo-400" />}
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{bio}</p>
                        <span className="inline-block text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          TAX: {taxId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold shrink-0">
                          {vendor.full_name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-200">{vendor.full_name}</p>
                          <p className="text-[10px] text-zinc-500">Joined {new Date(vendor.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1 text-xs font-semibold text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-zinc-550" />
                          <span>{vendor.email}</span>
                        </div>
                        {vendor.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-zinc-550" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleVerify(vendor.id, isVerified)}
                        disabled={loadingId === vendor.id}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                          isVerified
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10"
                        } disabled:opacity-50 cursor-pointer`}
                      >
                        {loadingId === vendor.id ? "Updating..." : isVerified ? "Revoke Verification" : "Approve Partner"}
                      </button>
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
