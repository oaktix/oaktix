import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import { ShieldAlert, Calendar } from "lucide-react";
import EventCreationWizard from "@/components/organizer/EventCreationWizard";

interface AdminEditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditEventPage({
  params,
}: AdminEditEventPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin");

  // ── Auth check ──────────────────────────────────────────────────────────────
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
          Only administrators may edit platform events.
        </p>
      </div>
    );
  }

  // ── Fetch event via service-role client (bypasses RLS) ──────────────────────
  const supabaseAdmin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Edit Event</h1>
          <p className="text-zinc-400">
            Admin mode — editing &quot;{event.title}&quot;
          </p>
        </div>
      </div>

      <EventCreationWizard
        event={event}
        isAdminMode
        returnPath="/admin/events"
      />
    </div>
  );
}
