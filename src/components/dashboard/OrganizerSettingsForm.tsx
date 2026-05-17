"use client";

import { useState } from "react";
import { User, Building2, Shield, Bell, Trash2, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface OrganizerSettingsFormProps {
  profile: {
    full_name?: string | null;
    bio?: string | null;
    website?: string | null;
    instagram?: string | null;
    role?: string | null;
  } | null;
  user: {
    id: string;
    email?: string;
  };
}

export default function OrganizerSettingsForm({ profile, user }: OrganizerSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "details" | "security" | "notifications">("profile");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const supabase = createClient();
  const router = useRouter();

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const orgBio = formData.get("orgBio") as string;
    const orgWebsite = formData.get("orgWebsite") as string;
    const orgInstagram = formData.get("orgInstagram") as string;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        bio: orgBio,
        website: orgWebsite,
        instagram: orgInstagram,
        role: profile?.role || "vendor"
      });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Organizer profile updated successfully!");
    }
    setLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Password updated successfully!");
      e.currentTarget.reset();
    }
    setLoading(false);
  }

  async function handleDeleteAccount() {
    if (deleteEmailInput.toLowerCase() !== (user.email || "").toLowerCase()) {
      setErrorMessage("Emails do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/delete-account", { method: "POST" });
    const data = await res.json();

    if (data.success) {
      router.push("/login");
      router.refresh();
    } else {
      setErrorMessage(data.error || "Failed to delete account.");
      setLoading(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Navigation Sidebar */}
      <div className="lg:col-span-1 space-y-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all ${
            activeTab === "profile" ? "bg-indigo-500/10 text-indigo-600 font-bold" : "text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50/50 font-medium"
          }`}
        >
          <Building2 className="w-5 h-5 text-indigo-500" />
          <span>Organizer Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("details")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all ${
            activeTab === "details" ? "bg-indigo-500/10 text-indigo-600 font-bold" : "text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50/50 font-medium"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Account & Deletion</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all ${
            activeTab === "security" ? "bg-indigo-500/10 text-indigo-600 font-bold" : "text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50/50 font-medium"
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Security</span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all ${
            activeTab === "notifications" ? "bg-indigo-500/10 text-indigo-600 font-bold" : "text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50/50 font-medium"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Notifications</span>
        </button>
      </div>

      {/* Settings Form panel */}
      <div className="lg:col-span-3 space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-green-700 font-semibold shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 font-semibold shadow-sm">
            {errorMessage}
          </div>
        )}

        {/* Tab 1: Organizer Profile */}
        {activeTab === "profile" && (
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
            <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
              <Building2 className="w-5 h-5 text-indigo-500" /> Organizer profile details
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-bold text-zinc-700">Organizer Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    defaultValue={profile?.full_name || ""}
                    placeholder="e.g. Rhythm & Blues Nigeria"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="orgEmail" className="block text-sm font-bold text-zinc-700">Contact Email</label>
                  <input
                    id="orgEmail"
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 outline-none text-sm cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="orgBio" className="block text-sm font-bold text-zinc-700">Organizer Biography / Description</label>
                <textarea
                  id="orgBio"
                  name="orgBio"
                  rows={4}
                  defaultValue={profile?.bio || ""}
                  placeholder="Tell ticket buyers who you are, what kind of events you organize..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-indigo-500 outline-none transition-all text-sm resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="orgWebsite" className="block text-sm font-bold text-zinc-700">Website URL</label>
                  <input
                    id="orgWebsite"
                    name="orgWebsite"
                    type="url"
                    defaultValue={profile?.website || ""}
                    placeholder="https://oaktix.com.ng"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="orgInstagram" className="block text-sm font-bold text-zinc-700">Instagram Handle</label>
                  <input
                    id="orgInstagram"
                    name="orgInstagram"
                    type="text"
                    defaultValue={profile?.instagram || ""}
                    placeholder="@oaktix_ng"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Account Details & Delete Account */}
        {activeTab === "details" && (
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm space-y-8">
            <div>
              <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
                <User className="w-5 h-5 text-indigo-500" /> Account details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Account ID</p>
                  <p className="text-sm font-mono text-zinc-700 font-semibold">{user.id}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Default Role</p>
                  <p className="text-sm text-zinc-700 font-bold capitalize">{profile?.role || "Vendor"}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-red-100 pt-6">
              <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Permanently delete your organizer account and all related event/ticket records. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete OakTix Account
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Security (Reset Password) */}
        {activeTab === "security" && (
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
            <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
              <Shield className="w-5 h-5 text-indigo-500" /> Security Settings
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#E8EBE7] rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-800 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Confirm New Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#E8EBE7] rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-800 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Security Password
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === "notifications" && (
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm">
            <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
              <Bell className="w-5 h-5 text-indigo-500" /> Notifications Settings
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-all cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500" />
                <div>
                  <p className="font-bold text-sm text-zinc-800">Email ticket sale notifications</p>
                  <p className="text-xs text-zinc-500">Receive an email immediately after a successful ticket purchase.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-all cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500" />
                <div>
                  <p className="font-bold text-sm text-zinc-800">Weekly financial statements</p>
                  <p className="text-xs text-zinc-500">Get a weekly summary of earnings and Thursday automatic settlement updates.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-all cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500" />
                <div>
                  <p className="font-bold text-sm text-zinc-800">Marketing & updates bulletins</p>
                  <p className="text-xs text-zinc-500">Stay informed about new event creation tools and community features.</p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-red-600 mb-2">Delete OakTix Account?</h3>
            <p className="text-zinc-600 text-sm mb-4">
              This action is permanent and irreversible. Please type your account email <strong className="text-zinc-800">{user.email || ""}</strong> below to confirm.
            </p>
            <input
              type="email"
              value={deleteEmailInput}
              onChange={(e) => setDeleteEmailInput(e.target.value)}
              placeholder={user.email || ""}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-red-500 text-sm mb-6 font-semibold"
            />
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading || deleteEmailInput.toLowerCase() !== (user.email || "").toLowerCase()}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
