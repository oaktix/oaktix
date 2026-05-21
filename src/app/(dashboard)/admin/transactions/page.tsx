import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ShieldAlert, Wallet } from "lucide-react";
import TransactionManagementList from "@/components/admin/TransactionManagementList";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-[var(--color-bg)] border border-[var(--color-muted)] rounded-2xl shadow-sm">
        <ShieldAlert className="w-16 h-16 text-[var(--color-accent)] mb-4" />
        <h1 className="text-2xl font-bold font-heading text-[var(--color-text)]">Unauthorized Access</h1>
        <p className="text-[var(--color-muted)] max-w-md mt-2 text-sm">
          Platform transaction ledger and finances are strictly reserved for administrative accounts.
        </p>
      </div>
    );
  }

  // Bypass RLS using service role to query transaction entries
  const supabaseAdmin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select(`
      *,
      buyer:profiles (
        full_name,
        email
      ),
      event:events (
        title,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to query transaction audit list in admin page:", error.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 text-[var(--color-text)] flex items-center gap-2">
          <Wallet className="w-8 h-8 text-[var(--color-primary)]" /> Platform Transactions Ledger
        </h1>
        <p className="text-[var(--color-muted)]">Inspect order references, examine fee allocations, review payout splits, and monitor overall GMV growth.</p>
      </div>

      <TransactionManagementList initialTransactions={transactions || []} />
    </div>
  );
}
