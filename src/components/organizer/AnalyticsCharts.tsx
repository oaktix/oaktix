"use client";

import { TrendingUp, DollarSign, Ticket } from "lucide-react";

interface EventTicketData {
  title: string;
  count: number;
  revenue: number;
}

interface TierTicketData {
  name: string;
  count: number;
}

interface DailySalesData {
  day: string;
  count: number;
}

interface AnalyticsChartsProps {
  ticketsByEvent: EventTicketData[];
  tierData: TierTicketData[];
  dailySalesData: DailySalesData[];
  totalTickets: number;
  totalRevenue: number;
}

// Map percentages to Tailwind static classes to bypass linter inline style warning
function getWidthClass(percent: number) {
  const rounded = Math.round(percent / 5) * 5;
  const clamped = Math.max(0, Math.min(100, rounded));
  if (clamped === 0) return "w-0";
  if (clamped === 100) return "w-full";
  const map: Record<number, string> = {
    5: "w-[5%]", 10: "w-[10%]", 15: "w-[15%]", 20: "w-[20%]", 25: "w-[25%]",
    30: "w-[30%]", 35: "w-[35%]", 40: "w-[40%]", 45: "w-[45%]", 50: "w-[50%]",
    55: "w-[55%]", 60: "w-[60%]", 65: "w-[65%]", 70: "w-[70%]", 75: "w-[75%]",
    80: "w-[80%]", 85: "w-[85%]", 90: "w-[90%]", 95: "w-[95%]"
  };
  return map[clamped] || "w-full";
}

function getHeightClass(percent: number) {
  const rounded = Math.round(percent / 5) * 5;
  const clamped = Math.max(0, Math.min(100, rounded));
  if (clamped === 0) return "h-0";
  const map: Record<number, string> = {
    5: "h-[5%]", 10: "h-[10%]", 15: "h-[15%]", 20: "h-[20%]", 25: "h-[25%]",
    30: "h-[30%]", 35: "h-[35%]", 40: "h-[40%]", 45: "h-[45%]", 50: "h-[50%]",
    55: "h-[55%]", 60: "h-[60%]", 65: "h-[65%]", 70: "h-[70%]", 75: "h-[75%]",
    80: "h-[80%]", 85: "h-[85%]", 90: "h-[90%]", 95: "h-[95%]", 100: "h-[100%]"
  };
  return map[clamped] || "h-[80%]";
}

export default function AnalyticsCharts({ 
  ticketsByEvent, 
  tierData, 
  dailySalesData, 
  totalTickets, 
  totalRevenue 
}: AnalyticsChartsProps) {

  // Find max value in daily sales to scale the custom bar chart
  const maxDailyCount = Math.max(...dailySalesData.map(d => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Total Sales Value</p>
            <p className="text-3xl font-bold font-heading text-indigo-400">₦{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-indigo-500" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Tickets Sold</p>
            <p className="text-3xl font-bold font-heading text-emerald-400">{totalTickets}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Avg. Ticket Price</p>
            <p className="text-3xl font-bold font-heading text-amber-400">
              ₦{totalTickets > 0 ? Math.round(totalRevenue / totalTickets).toLocaleString() : 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Sales Bar Chart */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold font-heading">Sales Trend (Last 7 Days)</h3>
            <p className="text-zinc-500 text-xs">Number of tickets sold per day.</p>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 pt-8 px-4 border-b border-white/10 relative">
            {dailySalesData.map((d, i) => {
              const heightPercentNum = (d.count / maxDailyCount) * 80;
              const heightClass = getHeightClass(heightPercentNum);
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-6 bg-indigo-600 text-white font-bold text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    {d.count} tickets
                  </div>
                  {/* Bar */}
                  <div 
                    className={`w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all duration-500 shadow-lg shadow-indigo-600/10 ${heightClass}`} 
                  />
                  {/* Label */}
                  <span className="text-xs text-zinc-500 mt-2 block font-medium">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tickets by Tier */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold font-heading">Sales by Ticket Tier</h3>
            <p className="text-zinc-500 text-xs">Distribution of tickets across VIP, Regular, etc.</p>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {tierData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-500">
                No tier data available.
              </div>
            ) : (
              tierData.map((tier, i) => {
                const percentage = totalTickets > 0 ? Math.round((tier.count / totalTickets) * 100) : 0;
                const widthClass = getWidthClass(percentage);
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{tier.name}</span>
                      <span className="text-zinc-400">{tier.count} sold ({percentage}%)</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${widthClass} ${
                          i % 3 === 0 ? "from-indigo-600 to-violet-500" : 
                          i % 3 === 1 ? "from-emerald-600 to-teal-500" : 
                          "from-amber-600 to-orange-500"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tickets by Event Table */}
      <div className="glass-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold font-heading">Event Performance</h3>
          <p className="text-zinc-500 text-xs">Comparing ticket volumes and revenues across your events.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase font-bold text-zinc-400">
                <th className="p-4">Event</th>
                <th className="p-4">Tickets Sold</th>
                <th className="p-4">Revenue</th>
                <th className="p-4">Share of Total</th>
              </tr>
            </thead>
            <tbody>
              {ticketsByEvent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No event data found.
                  </td>
                </tr>
              ) : (
                ticketsByEvent.map((e, idx) => {
                  const share = totalTickets > 0 ? Math.round((e.count / totalTickets) * 100) : 0;
                  const widthClass = getWidthClass(share);
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                      <td className="p-4 font-bold">{e.title}</td>
                      <td className="p-4">{e.count}</td>
                      <td className="p-4 font-bold text-indigo-400">₦{Number(e.revenue).toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-zinc-400">{share}%</span>
                          <div className="w-24 h-2.5 bg-white/5 rounded-full overflow-hidden shrink-0">
                            <div className={`h-full bg-indigo-500 rounded-full ${widthClass}`} />
                          </div>
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
    </div>
  );
}
