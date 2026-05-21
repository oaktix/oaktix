import { Wallet, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function VendorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch organizer's events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", user.id);

  const eventIds = events?.map(e => e.id) || [];

  // Fetch tickets sold for organizer's events
  let tickets: { price_paid?: number; status?: string; event_id?: string }[] = [];
  if (eventIds.length > 0) {
    const { data: tk } = await supabase
      .from("tickets")
      .select(`
        price_paid,
        status,
        event_id
      `)
      .in("event_id", eventIds);
    tickets = tk || [];
  }

  // Calculate Stats
  const totalRevenue = tickets.reduce((sum, t) => sum + (t.price_paid || 0), 0);
  const ticketsSold = tickets.length;
  
  const now = new Date();
  const activeEventsCount = events?.filter(e => e.status === "published" && new Date(e.start_date) > now).length || 0;

  // Next event
  const upcomingEvents = events?.filter(e => new Date(e.start_date) > now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const nextEvent = upcomingEvents?.[0];

  // Fetch recent transactions for organizer's events
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
      .limit(5);
    recentTransactions = tx || [];
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1">Organizer Dashboard</h1>
          <p className="text-zinc-500">Manage your events and track your sales.</p>
        </div>
        <Link 
          href="/organizer/events/new"
          className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" /> Create New Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <p className="text-sm text-zinc-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold font-heading">₦{totalRevenue.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            Real-time ticket earnings
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-zinc-500 mb-1">Tickets Sold</p>
          <p className="text-2xl font-bold font-heading">{ticketsSold}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            Across {events?.length || 0} event tiers
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-zinc-500 mb-1">Active Events</p>
          <p className="text-2xl font-bold font-heading">{activeEventsCount}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            {nextEvent ? `Next: ${new Date(nextEvent.start_date).toLocaleDateString()}` : "No upcoming events"}
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-zinc-500 mb-1">Average Attendance</p>
          <p className="text-2xl font-bold font-heading">--%</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            Waiting for QR validation integration
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading">Recent Transactions</h2>
            <Link href="/organizer/finances" className="text-sm text-indigo-400 font-bold flex items-center gap-1 hover:text-indigo-300">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="glass-card overflow-hidden">
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="font-bold">No transactions yet</p>
                <p className="text-zinc-500 text-sm mt-1">When you sell tickets, they will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="glass-card overflow-hidden p-4">
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-bold text-sm">{tx.profiles?.full_name || "Anonymous"}</p>
                      <p className="text-xs text-zinc-500">{tx.events?.title || "Unknown Event"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-400">₦{Number(tx.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-500">{tx.paid_at ? new Date(tx.paid_at).toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-heading">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/organizer/finances" className="block w-full text-left p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group">
              <p className="font-bold text-sm group-hover:text-indigo-400 transition-colors">Setup Payouts</p>
              <p className="text-xs text-zinc-500 mt-0.5">Link your payout bank account.</p>
            </Link>
            <Link href="/organizer/team" className="block w-full text-left p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group">
              <p className="font-bold text-sm group-hover:text-indigo-400 transition-colors">Team Access</p>
              <p className="text-xs text-zinc-500 mt-0.5">Add staff members to scan tickets.</p>
            </Link>
            <Link href="/organizer/communications" className="block w-full text-left p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group">
              <p className="font-bold text-sm group-hover:text-indigo-400 transition-colors">Marketing Tools</p>
              <p className="text-xs text-zinc-500 mt-0.5">Promote your events to your audience.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
