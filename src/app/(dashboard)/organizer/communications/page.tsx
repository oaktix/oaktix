import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EmailBroadcastForm from "@/components/organizer/EmailBroadcastForm";
import { Mail } from "lucide-react";

export default async function CommunicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch organizer's events
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id);

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
  }

  // Fetch past broadcast logs
  const { data: logs, error: logsError } = await supabase
    .from("email_logs")
    .select(`
      *,
      events:event_id (
        title
      )
    `)
    .eq("sender_id", user.id)
    .order("sent_at", { ascending: false });

  if (logsError) {
    console.error("Error fetching logs:", logsError);
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Mail className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Communications Console</h1>
          <p className="text-zinc-400">Broadcast updates, guidelines, or announcements to your ticket holders.</p>
        </div>
      </div>

      <EmailBroadcastForm 
        events={events || []} 
        initialLogs={logs || []} 
      />
    </div>
  );
}
