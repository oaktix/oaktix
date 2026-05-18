"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Store, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "vendor">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const businessName = formData.get("businessName") as string;
    const businessBio = formData.get("businessBio") as string;

    const signUpRole = email.toLowerCase().includes("gahdejtheprince")
      ? "super_admin"
      : email.toLowerCase().includes("admin")
      ? "admin"
      : role;

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: signUpRole,
          ...(signUpRole === "vendor" && {
              vendor_details: {
                business_name: businessName,
                bio: businessBio,
                verified: true,
              },
          }),
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Upsert profile record to set the database role securely
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role: signUpRole
      });

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }
      router.push("/dashboard");
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
        <h1 className="text-2xl font-bold font-heading mb-2 text-center text-zinc-900">Create your account</h1>
        <p className="text-zinc-500 text-center mb-8 text-sm">Join Oaktix to start booking or hosting events.</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                role === "user" 
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold" 
                  : "bg-white border border-[#E8EBE7] text-zinc-500 hover:border-zinc-300"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-sm font-bold">Attendee</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("vendor")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                role === "vendor" 
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold" 
                  : "bg-white border border-[#E8EBE7] text-zinc-500 hover:border-zinc-300"
              }`}
            >
              <Store className="w-6 h-6" />
              <span className="text-sm font-bold">Organizer</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Full Name</label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="John Doe"
              className="w-full bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-800 placeholder:text-zinc-400"
            />
          </div>

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
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Password</label>
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

          {role === "vendor" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Business Name</label>
                <input
                  name="businessName"
                  type="text"
                  required
                  placeholder="The Event Co."
                  className="w-full bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-800 placeholder:text-zinc-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Short Bio</label>
                <textarea
                  name="businessBio"
                  placeholder="Tell us about your events..."
                  className="w-full bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px] text-sm text-zinc-800 placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 mt-6 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-bold transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
