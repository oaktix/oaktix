import { Calendar, Ticket, Heart, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UserDashboard() {
  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="glass-card p-8 bg-gradient-to-br from-indigo-600/20 to-transparent border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-heading mb-2">Welcome back! 👋</h1>
          <p className="text-zinc-400">Ready for your next unforgettable experience?</p>
          <div className="flex gap-4 mt-6">
            <Link href="/events" className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" /> Discover Events
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl -mr-20 -mt-20 rounded-full" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Upcoming Tickets</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-600/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Saved Events</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Events Attended</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </div>

      {/* Next Event Countdown (Empty State) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-heading">Upcoming for You</h2>
            <Link href="/dashboard/tickets" className="text-sm text-indigo-400 font-bold flex items-center gap-1 hover:text-indigo-300">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="glass-card p-12 flex flex-col items-center text-center space-y-4 border-dashed border-white/5 bg-transparent">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-zinc-600" />
            </div>
            <div>
              <p className="text-lg font-bold">No upcoming events</p>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-1">Start exploring and book your first ticket today!</p>
            </div>
            <Link href="/events" className="text-indigo-400 font-bold hover:underline">
              Browse the catalog
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold font-heading">Recommendations</h2>
          <div className="space-y-4">
            <div className="glass-card p-4 flex gap-4 animate-pulse">
              <div className="w-20 h-20 rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
            <div className="glass-card p-4 flex gap-4 animate-pulse">
              <div className="w-20 h-20 rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
