import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SECTIONS } from "@/lib/admin/health-sections";
import AdminHealthCard from "@/components/admin/AdminHealthCard";

export const metadata: Metadata = {
  title: "Platform Health – OakTix Admin",
  description: "Live summary of all admin sections.",
};

export default async function AdminDashboardPage() {
  // Server-side auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  let role = user.user_metadata?.role as string | undefined;
  if (!role || (role !== "admin" && role !== "super_admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role;
    if (!role || (role !== "admin" && role !== "super_admin")) {
      redirect("/dashboard");
    }
  }

  // Service role client for unrestricted data access
  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Filter sections by role, then fetch all stats in parallel
  const visibleSections = ADMIN_SECTIONS.filter(
    (s) => !s.superAdminOnly || role === "super_admin"
  );

  const sectionsWithStats = await Promise.all(
    visibleSections.map(async (section) => {
      try {
        const stats = await section.fetchStats(adminSupabase);
        return { ...section, stats };
      } catch (err) {
        console.error(`Health section "${section.id}" fetchStats failed:`, err);
        return { ...section, stats: [{ label: "Error loading data", value: "—" }] };
      }
    })
  );

  const alertCount = sectionsWithStats.filter((s) =>
    s.stats.some((stat) => stat.status === "alert")
  ).length;
  const warningCount = sectionsWithStats.filter((s) =>
    s.stats.some((stat) => stat.status === "warning")
  ).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-muted)] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
            Platform Health
          </h1>
          <p className="text-[var(--color-muted)] text-sm">
            Live overview of all admin sections.{" "}
            {alertCount > 0 && (
              <span className="text-red-500 font-bold">{alertCount} section{alertCount > 1 ? "s" : ""} need attention.</span>
            )}
            {alertCount === 0 && warningCount > 0 && (
              <span className="text-amber-500 font-bold">{warningCount} section{warningCount > 1 ? "s" : ""} with warnings.</span>
            )}
            {alertCount === 0 && warningCount === 0 && (
              <span className="text-emerald-500 font-bold">All systems normal.</span>
            )}
          </p>
        </div>
        {role === "super_admin" && (
          <Link
            href="/admin/users"
            className="px-5 py-2.5 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-bg)] rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            Assign Roles
          </Link>
        )}
      </div>

      {/* Health grid — auto-populates from ADMIN_SECTIONS registry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {sectionsWithStats.map((section) => (
          <AdminHealthCard key={section.id} section={section} />
        ))}
      </div>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 pt-4">
        {visibleSections.length} section{visibleSections.length !== 1 ? "s" : ""} monitored · Add new sections to <code className="font-mono">src/lib/admin/health-sections.ts</code> to include them here automatically.
      </p>
    </div>
  );
}
