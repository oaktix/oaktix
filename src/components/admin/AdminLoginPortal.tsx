"use client";

import { useState } from "react";
import { Ticket, Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminLoginPortal() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleAdminLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Query their role from profiles table to ensure they are administrative
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const userRole = profile?.role || data.user.user_metadata?.role;

      if (userRole !== "admin" && userRole !== "super_admin") {
        // Sign them out immediately since they are unauthorized
        await supabase.auth.signOut();
        setError("Access Denied: This portal is strictly reserved for Admin and Super Admin accounts.");
        setLoading(false);
        return;
      }

      // Successful admin login
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic ambient backdrop lights */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
          <Ticket className="w-5.5 h-5.5" />
        </div>
        <span className="text-2xl font-bold font-heading tracking-tight flex items-center">
          <span className="text-indigo-400">Oak</span>
          <span className="text-amber-400">Tix</span>
          <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-300">ADMIN</span>
        </span>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold font-heading tracking-tight text-zinc-100">Administrative Login</h1>
          <p className="text-zinc-400 text-xs font-medium">Verify credentials to access secure system infrastructure.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 font-semibold flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Secure Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@oaktix.com.ng"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm text-zinc-100 placeholder:text-zinc-650 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Key Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm text-zinc-100 placeholder:text-zinc-650 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 mt-6 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate Admin Session"}
          </button>
        </form>
      </div>

      <div className="mt-8 relative z-10 text-center">
        <p className="text-zinc-600 text-xs font-medium">
          Authorized personnel only. All access attempts are securely logged.
        </p>
      </div>
    </div>
  );
}
