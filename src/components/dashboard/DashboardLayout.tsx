import ResponsiveLayout from "./ResponsiveLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const otpVerified = user.user_metadata?.otp_verified === true;
  if (!otpVerified) {
    redirect(`/verify?email=${encodeURIComponent(user.email || "")}&userId=${user.id}`);
  }

  const role = user.user_metadata?.role || 'user';

  return (
    <ResponsiveLayout role={role}>
      {children}
    </ResponsiveLayout>
  );
}
