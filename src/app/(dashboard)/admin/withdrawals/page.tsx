"use client";
import { useEffect, useState } from "react";
import WithdrawalManagementList, { Withdrawal } from "@/components/admin/WithdrawalManagementList";


export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);




  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/withdrawals");
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      } catch (e) {
        console.error("Failed to load withdrawals", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const res = await fetch("/api/admin/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      alert("Action failed");
    } else {
      // Refresh list
      (async () => {
        try {
          const res = await fetch("/api/admin/withdrawals");
          const data = await res.json();
          setWithdrawals(data.withdrawals || []);
        } catch (e) {
          console.error("Failed to refresh withdrawals", e);
        }
      })();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">
        Withdrawal Requests
      </h1>
      {loading ? (
        <p className="text-zinc-500">Loading withdrawals...</p>
      ) : (
        <WithdrawalManagementList withdrawals={withdrawals} onAction={handleAction} />
      )}
    </div>
  );
}
