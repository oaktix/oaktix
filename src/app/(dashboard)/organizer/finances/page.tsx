import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Wallet, ArrowDownCircle, CheckCircle2, Clock, Landmark, Plus } from "lucide-react";

export default async function OrganizerFinances() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch organizer's events to filter finances
  const { data: events } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);

  const eventIds = events?.map(e => e.id) || [];

  // Fetch tickets sold for organizer's events
  let tickets: { price_paid?: number; status?: string }[] = [];
  if (eventIds.length > 0) {
    const { data: tk } = await supabase
      .from("tickets")
      .select("price_paid, status")
      .in("event_id", eventIds);
    tickets = tk || [];
  }

  // Stats calculation
  const totalEarnings = tickets.reduce((sum, t) => sum + (t.price_paid || 0), 0);
  const pendingPayouts = totalEarnings * 0.15; // Simulated pending payouts
  const availableBalance = totalEarnings - pendingPayouts;

  // Recent transactions list
  let recentTransactions: { id?: string; amount?: number; paid_at?: string; profiles?: { full_name?: string; email?: string } | null; events?: { title?: string } | null }[] = [];
  if (eventIds.length > 0) {
    const { data: tx } = await supabase
      .from("transactions")
      .select(`
        *,
        profiles:buyer_id (
          full_name,
          email
        ),
        events:event_id (
          title
        )
      `)
      .in("event_id", eventIds)
      .order("paid_at", { ascending: false })
      .limit(10);
    recentTransactions = tx || [];
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-indigo-500" /> Financial Overview
          </h1>
          <p className="text-zinc-500">Monitor your ticket sales earnings, pending payouts, and bank payout methods.</p>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
          <p className="text-sm text-zinc-500 mb-1">Available for Payout</p>
          <p className="text-3xl font-bold font-heading text-green-600">₦{availableBalance.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Auto-transfers every Thursday
          </div>
        </div>

        <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
          <p className="text-sm text-zinc-500 mb-1">Pending Clearance</p>
          <p className="text-3xl font-bold font-heading text-amber-600">₦{pendingPayouts.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="w-4 h-4 text-amber-500" /> Escrow window: 24h post-event
          </div>
        </div>

        <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
          <p className="text-sm text-zinc-500 mb-1">Total Sales Earnings</p>
          <p className="text-3xl font-bold font-heading text-indigo-600">₦{totalEarnings.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <ArrowDownCircle className="w-4 h-4 text-indigo-500" /> Processing via Paystack
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payout Method (Landmark Bank Setup) */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold font-heading">Payout Bank Method</h2>
          
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

            <form className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="bank" className="text-xs font-bold text-zinc-600">Select Bank</label>
                <select id="bank" className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none bg-white">
                  <option>GTBank (Guaranty Trust)</option>
                  <option>Access Bank</option>
                  <option>Zenith Bank</option>
                  <option>UBA (United Bank for Africa)</option>
                  <option>Sterling Bank</option>
                  <option>Standard Chartered Bank</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="accountNumber" className="text-xs font-bold text-zinc-600">Account Number</label>
                <input
                  id="accountNumber"
                  type="text"
                  maxLength={10}
                  placeholder="0123456789"
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="accountHolder" className="text-xs font-bold text-zinc-600">Account Holder Name</label>
                <input
                  id="accountHolder"
                  type="text"
                  placeholder="e.g. John Doe Limited"
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Save Settlement Details
              </button>
            </form>
          </div>
        </div>

        {/* Transactions Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold font-heading">Recent Transactions History</h2>

          {recentTransactions.length === 0 ? (
            <div className="glass-card p-12 text-center bg-white border border-[#E8EBE7] shadow-sm">
              <Wallet className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="font-bold text-zinc-700">No payouts or earnings found</p>
              <p className="text-zinc-500 text-sm mt-1">Funds will list here once ticket buyers order tickets.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden bg-white border border-[#E8EBE7] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EBE7] bg-zinc-50/50">
                      <th className="p-4 font-bold text-zinc-600">Buyer</th>
                      <th className="p-4 font-bold text-zinc-600">Event</th>
                      <th className="p-4 font-bold text-zinc-600">Date</th>
                      <th className="p-4 font-bold text-zinc-600 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBE7]">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-zinc-800">{tx.profiles?.full_name || "Anonymous Buyer"}</p>
                          <p className="text-xs text-zinc-400">{tx.profiles?.email || ""}</p>
                        </td>
                        <td className="p-4 text-zinc-700 font-medium">{tx.events?.title || "Unknown Event"}</td>
                        <td className="p-4 text-zinc-500 text-xs">
                          {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "--"}
                        </td>
                        <td className="p-4 text-right font-bold text-indigo-600">
                          ₦{Number(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
