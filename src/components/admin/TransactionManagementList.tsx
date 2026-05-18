"use client";

import { useState, useEffect } from "react";
import { Search, DollarSign, Wallet, TrendingUp, Receipt, Calendar, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TransactionItem {
  id: string;
  reference: string;
  amount: number;
  platform_fee: number;
  vendor_net: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_channel?: string;
  paid_at?: string;
  created_at: string;
  buyer?: {
    full_name?: string;
    email?: string;
  };
  event?: {
    title?: string;
    slug?: string;
  };
}

interface TransactionManagementProps {
  initialTransactions: TransactionItem[];
}

export default function TransactionManagementList({ initialTransactions }: TransactionManagementProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        async () => {
          const { data } = await supabase
            .from("transactions")
            .select(`
              *,
              buyer:profiles (
                full_name,
                email
              ),
              event:events (
                title,
                slug
              )
            `)
            .order("created_at", { ascending: false });
          if (data) {
            setTransactions(data as unknown as TransactionItem[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredTransactions = transactions.filter((t) => {
    const ref = t.reference?.toLowerCase() || "";
    const email = t.buyer?.email?.toLowerCase() || "";
    const title = t.event?.title?.toLowerCase() || "";
    const term = search.toLowerCase();
    return ref.includes(term) || email.includes(term) || title.includes(term);
  });

  // Analytics Math
  const successfulTransactions = transactions.filter((t) => t.status === "success");
  const gmv = successfulTransactions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const platformRevenue = successfulTransactions.reduce((acc, curr) => acc + Number(curr.platform_fee || 0), 0);
  const vendorPayouts = successfulTransactions.reduce((acc, curr) => acc + Number(curr.vendor_net || 0), 0);

  return (
    <div className="space-y-6">
      {/* Financial Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Gross Sales (GMV)</p>
            <p className="text-2xl font-bold font-heading text-white">₦{gmv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Platform Revenue</p>
            <p className="text-2xl font-bold font-heading text-emerald-400">₦{platformRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Vendor Share</p>
            <p className="text-2xl font-bold font-heading text-amber-500">₦{vendorPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Paid Bookings</p>
            <p className="text-2xl font-bold font-heading text-zinc-200">{successfulTransactions.length} orders</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-350">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-zinc-900/20 border border-zinc-850 p-4 rounded-2xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search transactions by reference, email, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-850 bg-black/20 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900/40">
              <th className="px-6 py-4">Reference & Channel</th>
              <th className="px-6 py-4">Buyer & Event Info</th>
              <th className="px-6 py-4 text-right">Gross Paid</th>
              <th className="px-6 py-4 text-right">Platform Fee</th>
              <th className="px-6 py-4 text-right">Vendor Share</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-sm">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium bg-zinc-950/20">
                  No transaction ledger rows match the search query.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const paidAtDate = tx.paid_at || tx.created_at;
                const paidDateStr = new Date(paidAtDate).toLocaleDateString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                const buyerEmail = tx.buyer?.email || "Guest Checkout";
                const eventTitle = tx.event?.title || "Unknown Event";
                const paymentChan = tx.payment_channel || "Paystack";

                return (
                  <tr key={tx.id} className="hover:bg-zinc-900/20 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-zinc-200 text-xs tracking-wider">{tx.reference}</span>
                        <p className="text-[10px] text-zinc-500 font-semibold uppercase">{paymentChan}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div>
                        <p className="font-bold text-zinc-200 line-clamp-1">{eventTitle}</p>
                        <p className="text-xs text-zinc-500 line-clamp-1 flex items-center gap-1">
                          {buyerEmail} <ArrowUpRight className="w-3 h-3 text-zinc-650 shrink-0" />
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-100">
                      ₦{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-semibold">
                      ₦{Number(tx.platform_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-amber-500 font-semibold">
                      ₦{Number(tx.vendor_net || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tx.status === "success" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Paid
                        </span>
                      ) : tx.status === "pending" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400">
                          {tx.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-zinc-550 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-650" />
                        <span>{paidDateStr}</span>
                      </div>
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
