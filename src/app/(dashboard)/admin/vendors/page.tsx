import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import VendorManagementList from "@/components/admin/VendorManagementList";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin");

  // Fetch role to ensure admin or super_admin status
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
          Registered vendors management can only be accessed by platform administrators.
        </p>
      </div>
    );
  }

  // Bypass RLS selectively using service role to fetch all users who are vendors
  const supabaseAdmin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: vendors, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("role", "vendor")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch vendors inside admin panel:", error.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 text-zinc-900 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-indigo-500" /> Platform Partners & Vendors
        </h1>
        <p className="text-zinc-500">Monitor merchant accounts, review company details, and verify merchant partnerships.</p>
      </div>

      <VendorManagementList initialVendors={vendors || []} />
    </div>
  );
}
