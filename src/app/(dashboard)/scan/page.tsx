import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, Calendar, ArrowRight, ShieldAlert } from "lucide-react";

export default async function ScanDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Fetch events owned by user (organizer)
  const { data: ownedEvents } = await supabase
    .from("events")
    .select("id, title, start_date, status")
    .eq("organizer_id", user.id)
    .order("start_date", { ascending: true });

  // 2. Fetch events assigned to user as staff
  const { data: staffAssignments } = await supabase
    .from("scanners")
    .select(`
      event_id,
      events:event_id (
        id,
        title,
        start_date,
        status
      )
    `)
    .eq("staff_id", user.id);

  const assignedEvents = staffAssignments
    ?.map((sa: { events: { id: string; title: string; start_date: string; status: string } | { id: string; title: string; start_date: string; status: string }[] | null }) => {
      const ev = sa.events;
      return Array.isArray(ev) ? ev[0] : ev;
    })
    .filter((e): e is { id: string; title: string; start_date: string; status: string } => !!e) || [];

  // Combine and deduplicate events
  const allEventsMap = new Map();
  ownedEvents?.forEach(e => allEventsMap.set(e.id, { ...e, role: "Organizer" }));
  assignedEvents.forEach((e: { id: string; title: string; start_date: string; status: string }) => {
    if (!allEventsMap.has(e.id)) {
      allEventsMap.set(e.id, { ...e, role: "Staff Scanner" });
    }
  });

  const scanEvents = Array.from(allEventsMap.values());

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Ticket className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Ticket Scanner</h1>
          <p className="text-zinc-400">Select an event to launch the camera-based check-in console.</p>
        </div>
      </div>

      {scanEvents.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center text-center space-y-4 border-dashed border-white/5 bg-transparent">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-bold">No active events for scanning</p>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-1">
              You must be the organizer of an event or assigned as scanner staff to check-in guests.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scanEvents.map((event) => {
            const startDate = event.start_date ? new Date(event.start_date) : null;
            return (
              <div key={event.id} className="glass-card p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-indigo-400 border border-white/5 uppercase">
                      {event.role}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold uppercase">
                      {event.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-2 line-clamp-1">{event.title}</h3>
                  <p className="text-zinc-500 text-xs flex items-center gap-1.5 mt-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {startDate ? startDate.toLocaleString() : "No Date Set"}
                  </p>
                </div>
                
                <Link 
                  href={`/scan/${event.id}`}
                  className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all text-center flex items-center justify-center gap-2 group text-sm"
                >
                  Launch Scanner 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
