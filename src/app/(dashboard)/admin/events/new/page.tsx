import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldAlert, Calendar } from "lucide-react";
import EventCreationWizard from "@/components/organizer/EventCreationWizard";

export default async function AdminNewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || user.user_metadata?.role;

  if (userRole !== "admin" && userRole !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white border border-[#E8EBE7] rounded-2xl shadow-sm">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold font-heading text-zinc-800">
          Unauthorized Access
        </h1>
        <p className="text-zinc-500 max-w-md mt-2 text-sm">
          Only administrators may create platform events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Create Event</h1>
          <p className="text-zinc-400">
            Admin mode — event will be owned by your account.
          </p>
        </div>
      </div>

      <EventCreationWizard isAdminMode returnPath="/admin/events" />
    </div>
  );
}
