import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EmailsDashboardClient from "@/components/admin/EmailsDashboardClient";

export default async function SuperAdminEmailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Force authentication
  if (!user) {
    redirect("/login");
  }

  // 2. Validate super admin authorization
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || user.user_metadata?.role;

  if (userRole !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0E151B] text-zinc-100">
      {/* Branded Dark Header */}
      <Navbar user={user} theme="dark" />

      {/* Main Core Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Glow effect matching rich aesthetic system */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <EmailsDashboardClient />
      </main>

      {/* Branded Footer */}
      <Footer />
    </div>
  );
}
