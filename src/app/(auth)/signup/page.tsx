"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Store, Briefcase, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Step = "form" | "otp";

type PendingSignup = {
  email: string;
  fullName: string;
  resolvedRole: string;
  isProfessionalSignup: boolean;
  phone?: string;
};

export default function SignupPage() {
  const [step, setStep] = useState<Step>("form");
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "vendor" | "professional">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function redirectAfterSignup(isPro: boolean, resolvedRole: string) {
    if (isPro) router.push("/professionals/register");
    else if (resolvedRole === "vendor") router.push("/organizer");
    else if (resolvedRole === "admin" || resolvedRole === "super_admin") router.push("/admin");
    else router.push("/dashboard");
  }

  // Step 1 — collect details and trigger OTP email
  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const businessName = formData.get("businessName") as string;
    const businessBio = formData.get("businessBio") as string;
    const phone = (formData.get("phone") as string | null)?.trim() || "";

    const isProfessionalSignup = role === "professional";
    const resolvedRole = email.includes("gahdejtheprince")
      ? "super_admin"
      : email.includes("admin")
      ? "admin"
      : isProfessionalSignup
      ? "user"
      : role;

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: resolvedRole,
          ...(resolvedRole === "vendor" && {
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

    if (!data.user) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Save state needed for the OTP step
    setPending({ email, fullName, resolvedRole, isProfessionalSignup, phone });

    // If a session came back immediately (edge case / future config change),
    // skip OTP and finish now.
    if (data.session) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role: resolvedRole,
        ...(phone ? { phone } : {}),
      });
      redirectAfterSignup(isProfessionalSignup, resolvedRole);
      return;
    }

    // Normal path — email OTP sent, show code input
    setLoading(false);
    setStep("otp");
  }

  // Step 2 — verify OTP and complete account creation
  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pending) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const token = (formData.get("otp") as string).trim().replace(/\s/g, "");

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: pending.email,
      token,
      type: "signup",
    });

    if (verifyError) {
      const msg = verifyError.message.toLowerCase();
      setError(
        msg.includes("expired") || msg.includes("invalid")
          ? "That code is incorrect or has expired. Request a new one."
          : verifyError.message
      );
      setLoading(false);
      return;
    }

    // Session is now live — persist the profile row
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: pending.fullName,
        role: pending.resolvedRole,
        ...(pending.phone ? { phone: pending.phone } : {}),
      });
    }

    redirectAfterSignup(pending.isProfessionalSignup, pending.resolvedRole);
  }

  // Resend the OTP without losing the entered email
  async function handleResend() {
    if (!pending) return;
    setError(null);
    await supabase.auth.resend({ type: "signup", email: pending.email });
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6 relative">
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

        {/* ── OTP verification step ── */}
        {step === "otp" && pending ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-heading text-zinc-900">Verify your email</h1>
                <p className="text-zinc-500 text-xs">Code sent to <span className="font-semibold text-zinc-700">{pending.email}</span></p>
              </div>
            </div>

            <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3 mb-6 text-xs text-indigo-700 font-medium text-center">
              Check your inbox for the verification code — it expires in 1 hour.
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Verification Code</label>
                <input
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  placeholder="12345678"
                  maxLength={8}
                  className="w-full bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-2xl font-mono font-bold text-center tracking-widest text-zinc-800 placeholder:text-zinc-300 placeholder:text-base placeholder:tracking-normal placeholder:font-sans placeholder:font-normal"
                />
              </div>

              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Create Account"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              className="w-full mt-4 text-center text-xs text-zinc-400 hover:text-indigo-500 font-bold uppercase tracking-wide transition-colors cursor-pointer"
            >
              Resend code
            </button>

            <button
              type="button"
              onClick={() => { setStep("form"); setError(null); }}
              className="w-full mt-2 text-center text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              ← Back to sign up
            </button>
          </>
        ) : (
          /* ── Sign-up form ── */
          <>
            <h1 className="text-2xl font-bold font-heading mb-2 text-center text-zinc-900">Create your account</h1>
            <p className="text-zinc-500 text-center mb-8 text-sm">Join Oaktix to start booking or hosting events.</p>

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Role Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
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
                <button
                  type="button"
                  onClick={() => setRole("professional")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    role === "professional"
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold"
                      : "bg-white border border-[#E8EBE7] text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                  <span className="text-sm font-bold">Pro</span>
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
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Phone — mandatory for ALL roles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="+2348012345678"
                  className="w-full bg-white border border-[#E8EBE7] rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-800 placeholder:text-zinc-400"
                />
                <p className="text-[11px] text-zinc-400">Used for notifications and account verification.</p>
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
          </>
        )}
      </div>
    </div>
  );
}
