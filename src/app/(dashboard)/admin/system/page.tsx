import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings, ShieldAlert, Key } from "lucide-react";
import SystemSettingsForm from "@/components/admin/SystemSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin");

  // Fetch role to ensure only super_admins can access system configs
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || user.user_metadata?.role;

  if (userRole !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white border border-[#E8EBE7] rounded-2xl shadow-sm">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold font-heading text-zinc-800">Unauthorized Access</h1>
        <p className="text-zinc-555 max-w-md mt-2 text-sm">
          System settings and global platform markup fees can only be managed by **Super Admins**.
        </p>
      </div>
    );
  }

  // Attempt to fetch current configuration, with safe fallback if table does not exist yet
  const currentSettings = {
    platform_markup_fee: 4.0,
    zero_fee_mode: false,
    global_announcement: "Enjoy zero platform charges on selected events this season!",
    enable_guest_checkout: true,
    enable_qr_sound: true,
  };

  try {
    const { data: configData } = await supabase
      .from("system_configurations")
      .select("*");

    if (configData && configData.length > 0) {
      const markupData = configData.find((c) => c.key === "platform_markup");
      const generalData = configData.find((c) => c.key === "general_configs");

      if (markupData?.value) {
        currentSettings.platform_markup_fee = markupData.value.percentage ?? 4.0;
        currentSettings.zero_fee_mode = markupData.value.zero_fee_mode ?? false;
      }
      if (generalData?.value) {
        currentSettings.global_announcement = generalData.value.global_announcement ?? currentSettings.global_announcement;
        currentSettings.enable_guest_checkout = generalData.value.enable_guest_checkout ?? true;
        currentSettings.enable_qr_sound = generalData.value.enable_qr_sound ?? true;
      }
    }
  } catch {
    // Graceful fallback to default mock object on schema absence
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2.5">
          <Settings className="w-8 h-8 text-indigo-500" /> Platform Infrastructure & Settings
        </h1>
        <p className="text-zinc-550">Configure global transaction fees, toggle operational feature flags, and publish announcements.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-semibold flex items-center gap-3">
        <Key className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold">Database Check:</span> If you haven&apos;t done so, create the <code>system_configurations</code> table in your Supabase SQL Editor to make these settings fully database-persistent. (The panel uses safe default values automatically if the table isn&apos;t created yet!).
        </div>
      </div>

      <SystemSettingsForm initialSettings={currentSettings} />
    </div>
  );
}
