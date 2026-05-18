import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EventCreationWizard from "@/components/organizer/EventCreationWizard";
import { Calendar } from "lucide-react";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the event and check ownership
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  // Check ownership: only organizer themselves or admin/superadmin can edit
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role;
  const isAuthorized = event.organizer_id === user.id || role === "admin" || role === "super_admin";

  if (!isAuthorized) {
    redirect("/organizer/events");
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Edit Event</h1>
          <p className="text-zinc-400">Update details for &quot;{event.title}&quot;</p>
        </div>
      </div>

      <EventCreationWizard event={event} />
    </div>
  );
}
