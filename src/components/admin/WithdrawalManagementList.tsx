import React from "react";
import { Banknote, CheckCircle, XCircle } from "lucide-react";

export interface Withdrawal {
  id: string;
  vendor_id: string;
  amount: number;
  requested_at: string;
  status: string;
  processed_at?: string;
}

interface Props {
  withdrawals: Withdrawal[];
  onAction: (id: string, action: "approve" | "reject") => Promise<void>;
  loadingIds?: Set<string>;
}

export default function WithdrawalManagementList({ withdrawals, onAction, loadingIds = new Set() }: Props) {
  return (
    <div className="overflow-x-auto glass-card p-4 bg-white border border-[#E8EBE7] shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₦)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {withdrawals.map((w) => (
            <tr key={w.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2 text-sm text-gray-700">{w.vendor_id}</td>
              <td className="px-4 py-2 text-sm font-semibold text-indigo-600">{w.amount.toLocaleString()}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{new Date(w.requested_at).toLocaleDateString()}</td>
              <td className="px-4 py-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  w.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : w.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-rose-100 text-rose-800"
                }`}>
                  {w.status}
                </span>
              </td>
              <td className="px-4 py-2 text-center">
                {w.status === "pending" ? (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      disabled={loadingIds.has(w.id)}
                      onClick={() => onAction(w.id, "approve")}
                      className="p-1 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                      aria-label="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      disabled={loadingIds.has(w.id)}
                      onClick={() => onAction(w.id, "reject")}
                      className="p-1 text-rose-600 hover:bg-rose-100 rounded-full transition-colors"
                      aria-label="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Banknote className="w-5 h-5 text-gray-400" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
