import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings, User, Shield, Bell } from "lucide-react";

export default async function UserSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch current user details or profile metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1 flex items-center gap-2">
          <Settings className="w-8 h-8 text-indigo-500" /> Account Settings
        </h1>
        <p className="text-zinc-500">Configure your profile details, password security, and preference configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-600 font-bold text-left transition-all">
            <User className="w-5 h-5 text-indigo-500" />
            <span>My Profile</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50/50 font-medium text-left transition-all">
            <Shield className="w-5 h-5" />
            <span>Security</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50/50 font-medium text-left transition-all">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Settings Form panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
            <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
              <User className="w-5 h-5 text-indigo-500" /> Profile details
            </h2>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-zinc-700">Full Name</label>
                  <input
                    type="text"
                    defaultValue={profile?.full_name || ""}
                    placeholder="e.g. Adewale Chiroma"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-zinc-700">Account Email</label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 outline-none text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-zinc-700">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 80 1234 5678"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-zinc-700">Country / Region</label>
                  <input
                    type="text"
                    defaultValue="Nigeria"
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 outline-none text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
