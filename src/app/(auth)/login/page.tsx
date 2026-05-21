"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role || data.user.user_metadata?.role || "user";

      if (role === "vendor") {
        router.push("/organizer");
      } else if (role === "admin" || role === "super_admin") {
        router.push("/admin");
      } else if (role === "staff") {
        router.push("/scan");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <Link href="/" className="flex items-center mb-8 relative z-10 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-header.png"
          alt="OakTix"
          className="h-10 w-auto object-contain"
        />
      </Link>

      <div className="glass-card w-full max-w-md p-8 relative z-10 bg-white border border-[#E8EBE7] shadow-sm">
        <h1 className="text-2xl font-bold font-heading mb-2 text-center text-zinc-900">Welcome back</h1>
        <p className="text-zinc-500 text-center mb-8 text-sm">Enter your details to access your dashboard.</p>

        {message && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 text-sm text-indigo-500 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Email Address</label>
            <input
              name="email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-800 placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Password</label>
              <Link href="/forgot-password" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                Forgot password?
              </Link>
            </div>
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 mt-6 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log in"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-indigo-500 hover:text-indigo-600 font-bold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex items-center justify-center font-bold">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
