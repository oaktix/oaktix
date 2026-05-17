import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import UserSettingsForm from "@/components/dashboard/UserSettingsForm";

export default async function UserSettings() {
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
        <p className="text-zinc-500">Configure your profile details, password security, and preference configurations.</p>
      </div>

      <UserSettingsForm profile={profile} user={user} />
    </div>
  );
}
