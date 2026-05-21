"use client";

import { useState } from "react";
import { Banknote, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface WithdrawalFormProps {
  profile: any;
  availableBalance: number;
}

export default function WithdrawalForm({ profile, availableBalance }: WithdrawalFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedAmount = Number(amount) || 0;
  const withdrawalFee = parsedAmount > 0 ? 50 : 0;
  const totalDebit = parsedAmount > 0 ? parsedAmount + 50 : 0;

  const isBankLinked = !!profile?.vendor_details?.payout_account_number;
  const hasInsufficientFunds = availableBalance < 50;
  const exceedsBalance = totalDebit > availableBalance;

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (parsedAmount <= 0) {
      setError("Please enter a valid amount to withdraw.");
      setLoading(false);
      return;
    }

    if (exceedsBalance) {
      setError(`Insufficient available balance. You need at least ₦${totalDebit.toLocaleString()} (including the ₦50 fee) but only have ₦${availableBalance.toLocaleString()} available.`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/organizer/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process withdrawal request.");
      }

      setSuccess("Withdrawal request submitted successfully! It will take up to 24 hours to process.");
      setAmount("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
          <Banknote className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-sm">Request Withdrawal</p>
          <p className="text-xs text-zinc-500">Withdraw your funds to your linked bank account</p>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
          {error}
        </div>
      )}

      {!isBankLinked ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-600" /> Bank Account Required
          </p>
          <p>Please configure your <strong>Payout Bank Method</strong> first in the settlement section before requesting a withdrawal.</p>
        </div>
      ) : hasInsufficientFunds ? (
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-zinc-700">
            <Info className="w-4 h-4 text-zinc-500" /> Insufficient Balance
          </p>
          <p>You need a balance of at least ₦50 (payout fee) to initiate any withdrawals.</p>
        </div>
      ) : (
        <form onSubmit={handleRequestWithdrawal} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="withdrawAmount" className="text-xs font-bold text-zinc-600">Amount (₦)</label>
            <input
              id="withdrawAmount"
              type="text"
              pattern="^[0-9]*$"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 5000"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none font-medium transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {parsedAmount > 0 && (
            <div className="bg-zinc-50 border border-[#E8EBE7] rounded-xl p-3.5 space-y-2 text-xs text-zinc-600 font-medium">
              <div className="flex justify-between">
                <span>Requested Amount</span>
                <span className="font-semibold text-zinc-800">₦{parsedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Fee</span>
                <span className="font-semibold text-zinc-800">₦{withdrawalFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-dashed border-[#E8EBE7] pt-2 flex justify-between font-bold text-zinc-800">
                <span>Total Debit</span>
                <span className={exceedsBalance ? "text-red-600" : "text-green-600"}>
                  ₦{totalDebit.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 italic pt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                Processed payouts take up to 24 hours.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || parsedAmount <= 0 || exceedsBalance}
            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirm & Request"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
