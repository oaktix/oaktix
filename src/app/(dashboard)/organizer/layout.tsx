import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import OrganizerPhoneModal from "@/components/organizer/OrganizerPhoneModal";

export default async function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let showPhoneModal = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, role")
      .eq("id", user.id)
      .maybeSingle();

    // Only prompt organizers (vendors) who haven't set a phone yet
    if (profile?.role === "vendor" && !profile?.phone) {
      showPhoneModal = true;
    }
  }

  return (
    <DashboardLayout>
      {showPhoneModal && <OrganizerPhoneModal />}
      {children}
    </DashboardLayout>
  );
}
