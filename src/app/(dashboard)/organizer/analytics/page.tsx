import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsCharts from "@/components/organizer/AnalyticsCharts";
import { BarChart3 } from "lucide-react";

interface TicketRecord {
  id: string;
  price_paid: number;
  created_at: string;
  ticket_type?: { name: string } | null;
  event_id: string;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch organizer's events
  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_date")
    .eq("organizer_id", user.id);

  const eventIds = events?.map(e => e.id) || [];

  // Fetch tickets sold for organizer's events
  let tickets: TicketRecord[] = [];
  if (eventIds.length > 0) {
    const { data: tk } = await supabase
      .from("tickets")
      .select(`
        id,
        price_paid,
        created_at,
        ticket_type,
        event_id
      `)
      .in("event_id", eventIds);
    tickets = (tk as unknown as TicketRecord[]) || [];
  }

  // Pre-process Data: Tickets Sold per Event
  const ticketsByEvent = events?.map(event => {
    const count = tickets.filter(t => t.event_id === event.id).length;
    const revenue = tickets.filter(t => t.event_id === event.id).reduce((sum, t) => sum + (t.price_paid || 0), 0);
    return {
      title: event.title,
      count,
      revenue
    };
  }) || [];

  // Pre-process Data: Tickets Sold per Tier (VIP, General, etc.)
  const tierBreakdown: Record<string, { count: number; revenue: number }> = {};
  tickets.forEach(t => {
    const name = t.ticket_type?.name || "General Admission";
    if (!tierBreakdown[name]) {
      tierBreakdown[name] = { count: 0, revenue: 0 };
    }
    tierBreakdown[name].count += 1;
    tierBreakdown[name].revenue += (t.price_paid || 0);
  });

  const tierData = Object.entries(tierBreakdown).map(([name, data]) => ({
    name,
    count: data.count,
    revenue: data.revenue
  }));

  // Pre-process Data: Daily Sales (last 7 days)
  const salesByDay: Record<string, number> = {};
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    salesByDay[dateStr] = 0;
  }

  tickets.forEach(t => {
    if (t.created_at) {
      const dateStr = new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (dateStr in salesByDay) {
        salesByDay[dateStr] += 1;
      }
    }
  });

  const dailySalesData = Object.entries(salesByDay).map(([day, count]) => ({
    day,
    count
  }));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Event Analytics</h1>
          <p className="text-zinc-400">Deep-dive into sales metrics, ticket performance, and insights.</p>
        </div>
      </div>

      <AnalyticsCharts 
        ticketsByEvent={ticketsByEvent}
        tierData={tierData}
        dailySalesData={dailySalesData}
        totalTickets={tickets.length}
        totalRevenue={tickets.reduce((sum, t) => sum + (t.price_paid || 0), 0)}
      />
    </div>
  );
}
