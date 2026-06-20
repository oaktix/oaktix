"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Step = "email" | "otp";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Step 1 — send OTP to the user's email
  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const emailValue = (formData.get("email") as string).trim().toLowerCase();
    setEmail(emailValue);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailValue);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("otp");
  }

  // Step 2 — verify the OTP code and redirect to set a new password
  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const token = (formData.get("otp") as string).trim().replace(/\s/g, "");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (verifyError) {
      setError(verifyError.message === "Token has expired or is invalid"
        ? "That code is incorrect or has expired. Please request a new one."
        : verifyError.message);
      setLoading(false);
      return;
    }

    // Session is now set — redirect to the reset-password form
    router.push("/reset-password");
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
        {step === "email" ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-heading text-zinc-900">Forgot password?</h1>
                <p className="text-zinc-500 text-xs">We&apos;ll send a code to your email.</p>
              </div>
            </div>

            <form onSubmit={handleSendCode} className="space-y-5">
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

              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-heading text-zinc-900">Enter your code</h1>
                <p className="text-zinc-500 text-xs">Sent to <span className="font-semibold text-zinc-700">{email}</span></p>
              </div>
            </div>

            <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3 mb-6 text-xs text-indigo-700 font-medium text-center">
              Check your inbox for the reset code — it expires in 1 hour.
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Reset Code</label>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setStep("email"); setError(null); }}
              className="w-full mt-4 text-center text-xs text-zinc-400 hover:text-indigo-500 font-bold uppercase tracking-wide transition-colors cursor-pointer"
            >
              Resend or use a different email
            </button>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-zinc-500 hover:text-indigo-500 font-bold text-xs uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
