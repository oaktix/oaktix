import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/server";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If there is no active user, render clean without the dashboard shell (sidebar, drawers)
  if (!user) {
    return <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">{children}</div>;
  }

  // Fetch their profile to verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || user.user_metadata?.role;

  // Protect against non-admin sessions trying to load dashboard layout
  if (userRole !== "admin" && userRole !== "super_admin") {
    return <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">{children}</div>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
