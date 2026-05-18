"use client";

import { useState } from "react";
import { Landmark, Edit2, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SettlementFormProps {
  profile: any;
}

export default function SettlementForm({ profile }: SettlementFormProps) {
  const supabase = createClient();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(!profile?.vendor_details?.payout_account_number);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [bank, setBank] = useState(profile?.vendor_details?.payout_bank || "GTBank (Guaranty Trust Bank)");
  const [accountNumber, setAccountNumber] = useState(profile?.vendor_details?.payout_account_number || "");
  const [accountHolder, setAccountHolder] = useState(profile?.vendor_details?.payout_account_name || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!accountNumber || accountNumber.length < 10) {
      setError("Please enter a valid 10-digit account number.");
      setLoading(false);
      return;
    }

    if (!accountHolder) {
      setError("Please enter the account holder name.");
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        vendor_details: {
          ...(profile?.vendor_details || {}),
          payout_bank: bank,
          payout_account_number: accountNumber,
          payout_account_name: accountHolder
        }
      })
      .eq("id", profile.id);

    if (dbError) {
      setError(dbError.message);
    } else {
      setSuccess("Settlement details updated successfully!");
      setIsEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  if (!isEditing && profile?.vendor_details?.payout_account_number) {
    return (
      <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm">Settlement Account</p>
              <p className="text-xs text-green-600 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> Linked & Verified
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-bold text-zinc-600 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Bank Name</p>
            <p className="text-sm font-semibold text-zinc-800">{profile.vendor_details.payout_bank}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Account Number</p>
            <p className="text-sm font-mono font-semibold text-zinc-800">
              {profile.vendor_details.payout_account_number.slice(0, 3)} •••• {profile.vendor_details.payout_account_number.slice(-3)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Account Holder Name</p>
            <p className="text-sm font-semibold text-zinc-800">{profile.vendor_details.payout_account_name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-sm">Settlement Account</p>
          <p className="text-xs text-zinc-500">Requires a Nigerian bank account</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="bank" className="text-xs font-bold text-zinc-600">Select Bank</label>
          <select
            id="bank"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none bg-white font-medium text-zinc-700"
          >
            <option>GTBank (Guaranty Trust Bank)</option>
            <option>Access Bank</option>
            <option>Zenith Bank</option>
            <option>United Bank for Africa (UBA)</option>
            <option>First Bank of Nigeria (FirstBank)</option>
            <option>Fidelity Bank</option>
            <option>Sterling Bank</option>
            <option>Stanbic IBTC Bank</option>
            <option>Union Bank of Nigeria</option>
            <option>Wema Bank</option>
            <option>Ecobank Nigeria</option>
            <option>FCMB (First City Monument Bank)</option>
            <option>Polaris Bank</option>
            <option>Keystone Bank</option>
            <option>Standard Chartered Bank</option>
            <option>Providus Bank</option>
            <option>OPay (Digital/MFB)</option>
            <option>Moniepoint MFB</option>
            <option>Kuda Microfinance Bank</option>
            <option>Palmpay (Digital/MFB)</option>
            <option>VFD Microfinance Bank (Vbank)</option>
            <option>Rubies Bank</option>
            <option>Carbon</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="accountNumber" className="text-xs font-bold text-zinc-600">Account Number</label>
          <input
            id="accountNumber"
            type="text"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="0123456789"
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="accountHolder" className="text-xs font-bold text-zinc-600">Account Holder Name</label>
          <input
            id="accountHolder"
            type="text"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="e.g. John Doe Limited"
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none font-medium"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {profile?.vendor_details?.payout_account_number && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-sm transition-all text-center cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Details"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
