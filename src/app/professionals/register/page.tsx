import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProfessionalRegistrationWizard from "@/components/professionals/ProfessionalRegistrationWizard";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/professionals/queries";
import { getProfessionalByUserId } from "@/lib/professionals/queries";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Register as an Event Professional | OakTix",
  description:
    "Create your free professional profile on OakTix and start receiving bookings from thousands of event organisers across Nigeria.",
};

export default async function RegisterProfessionalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/professionals/register");
  }

  const [categories, existingProfile] = await Promise.all([
    getCategories(),
    getProfessionalByUserId(user.id),
  ]);

  // If already has a profile, redirect appropriately
  if (existingProfile) {
    if (existingProfile.status === "approved") {
      redirect("/professional");
    }
    // Pending/rejected — show status
    return (
      <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b]">
        <Navbar user={user} theme="light" />
        <main className="flex-1 flex items-center justify-center px-6 py-20 mt-16">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
              {existingProfile.status === "pending" ? (
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="text-4xl">⏳</span>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-4xl">❌</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white mb-3">
              {existingProfile.status === "pending"
                ? "Application Under Review"
                : "Application Not Approved"}
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              {existingProfile.status === "pending"
                ? "Your professional profile has been submitted and is being reviewed by our team. You'll be notified once approved (typically 1–2 business days)."
                : existingProfile.rejection_reason
                ? `Your application was not approved: ${existingProfile.rejection_reason}`
                : "Your application was not approved at this time. Please contact support for more information."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/professionals"
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
              >
                Browse Professionals
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </main>
        <Footer theme="light" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b]">
      <Navbar user={user} theme="light" />

      {/* Hero */}
      <div className="bg-[#0E4B31] pt-28 pb-12 px-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
          Join OakTix Professionals
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white mb-3">
          Create Your Professional Profile
        </h1>
        <p className="text-indigo-100/80 text-sm max-w-lg mx-auto">
          Get discovered by thousands of event organisers. It&apos;s free to join and create your profile.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-6 mt-6 text-xs font-bold text-white/70 uppercase tracking-wider">
          {[
            "Free Profile",
            "Direct Inquiries",
            "Analytics",
            "Verified Badge",
          ].map((b) => (
            <span key={b} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> {b}
            </span>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <ProfessionalRegistrationWizard categories={categories} />
      </main>

      {/* Trust footer */}
      <div className="border-t border-[#E8EBE7] dark:border-white/5 bg-white dark:bg-zinc-900 py-6 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs text-zinc-400">
          <span>🔒 Your data is secure</span>
          <span>📧 We&apos;ll notify you upon approval</span>
          <span>✅ Free forever — no hidden fees</span>
          <Link href="/professionals" className="text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
            Browse professionals <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <Footer theme="light" />
    </div>
  );
}
