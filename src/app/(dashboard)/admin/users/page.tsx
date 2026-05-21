import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, ShieldAlert } from "lucide-react";
import UserRoleManager from "@/components/admin/UserRoleManager";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin");

  // Fetch the role of the logged in user to verify they are a super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || user.user_metadata?.role;

  if (userRole !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-[var(--color-bg)] border border-[var(--color-muted)] rounded-2xl shadow-sm">
        <ShieldAlert className="w-16 h-16 text-[var(--color-accent)] mb-4" />
        <h1 className="text-2xl font-bold font-heading text-[var(--color-text)]">Unauthorized Access</h1>
        <p className="text-[var(--color-muted)] max-w-md mt-2 text-sm">
          Role assignment is strictly restricted to **Super Admins**. Normal administrators do not have access to view or edit platform user credentials.
        </p>
      </div>
    );
  }

  // Fetch all profiles from the database to populate the role manager
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  const safeProfiles = allProfiles || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2.5">
          <Users className="w-8 h-8 text-indigo-500" /> Platform Role Manager
        </h1>
        <p className="text-zinc-550">Search for platform users, modify roles, or authorize new administrators.</p>
      </div>

      <UserRoleManager initialUsers={safeProfiles} currentUserId={user.id} />
    </div>
  );
}
