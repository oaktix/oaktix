import { Sidebar } from "./Sidebar";
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

  const role = user.user_metadata?.role || 'user';

  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto p-8 relative bg-[#FAF9F6] text-[#1A1A1A]">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
