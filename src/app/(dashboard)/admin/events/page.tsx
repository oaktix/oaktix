import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ShieldAlert, Calendar } from "lucide-react";
import EventManagementList from "@/components/admin/EventManagementList";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        <h1 className="text-2xl font-bold font-heading text-zinc-800">Unauthorized Access</h1>
        <p className="text-zinc-500 max-w-md mt-2 text-sm">
          Platform events moderation is strictly reserved for administrative accounts.
        </p>
      </div>
    );
  }

  // Fetch all events including information about their organizers
  const supabaseAdmin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select(`
      *,
      organizer:profiles (
        full_name,
        email,
        vendor_details
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to query events inside admin page:", error.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2.5">
          <Calendar className="w-8 h-8 text-indigo-500" /> Platform Events & Moderation</h1>
        <p className="text-[var(--color-muted)]">Monitor all physical and virtual listings, enforce safety standards, and handle event statuses.</p>
      </div>

      <EventManagementList initialEvents={events || []} />
    </div>
  );
}
