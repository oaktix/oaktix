import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EventCreationWizard from "@/components/organizer/EventCreationWizard";
import { Calendar } from "lucide-react";

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role;
  if (role !== "vendor" && role !== "admin" && role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Create New Event</h1>
          <p className="text-zinc-400">Set up your next amazing experience in minutes.</p>
        </div>
      </div>

      <EventCreationWizard />
    </div>
  );
}
