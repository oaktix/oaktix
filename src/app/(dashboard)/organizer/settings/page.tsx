import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import OrganizerSettingsForm from "@/components/dashboard/OrganizerSettingsForm";

export default async function OrganizerSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch current user details or profile metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2">
          <Settings className="w-8 h-8 text-indigo-500" /> Account Settings
        </h1>
        <p className="text-zinc-500">Configure your organizer details, security preferences, and account deletion details.</p>
      </div>

      <OrganizerSettingsForm profile={profile} user={user} />
    </div>
  );
}
