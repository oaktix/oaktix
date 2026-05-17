"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { Ticket, Loader2, ArrowLeft, MailCheck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyOTPForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const supabase = createClient();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInput = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);
    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const token = code || otp.join("");
    if (token.length !== 6) return;

    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (verifyError) {
      setError("Invalid or expired code. Please check and try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError("Failed to resend code. Please try again.");
    } else {
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }

    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex flex-col items-center justify-center p-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 relative z-10 group">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <Ticket className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold font-heading tracking-tight flex items-center">
          <span className="text-indigo-500">Oak</span>
          <span className="text-amber-500">Tix</span>
        </span>
      </Link>

      <div className="glass-card w-full max-w-md p-8 relative z-10 bg-white border border-[#E8EBE7] shadow-sm">
        {success ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <MailCheck className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold font-heading text-zinc-900 mb-2">Email Verified!</h2>
            <p className="text-zinc-500 text-sm">Redirecting you to your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                <MailCheck className="w-7 h-7 text-indigo-500" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-zinc-900 mb-1">Check your email</h1>
              <p className="text-zinc-500 text-sm leading-relaxed">
                We sent a 6-digit verification code to
              </p>
              <p className="font-bold text-zinc-800 text-sm mt-0.5">{email}</p>
            </div>

            {/* OTP Input Grid */}
            <div className="flex items-center justify-center gap-3 my-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
                    ${digit
                      ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                      : "border-zinc-200 bg-zinc-50 text-zinc-800"
                    } focus:border-indigo-500 focus:bg-indigo-50`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold text-center mb-4">{error}</p>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerify()}
              disabled={loading || otp.some((d) => d === "")}
              className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Email"}
            </button>

            {/* Resend */}
            <div className="mt-5 text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-600 font-bold transition-colors mx-auto"
                >
                  {resending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend code
                </button>
              ) : (
                <p className="text-zinc-400 text-sm">
                  Resend code in <span className="font-bold text-zinc-600">{countdown}s</span>
                </p>
              )}
            </div>

            {/* Back link */}
            <div className="mt-6 pt-5 border-t border-[#E8EBE7] text-center">
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign up
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <VerifyOTPForm />
    </Suspense>
  );
}
