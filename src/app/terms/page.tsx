import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full pt-32 pb-24 px-6 relative space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading text-indigo-500 tracking-tight">Terms of Service</h1>
          <p className="text-zinc-500 text-sm mt-2">Last Updated: May 2026</p>
        </div>

        <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or using the OakTix event platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease using the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">2. Ticketing & Payments</h2>
            <p>
              All payments for event tickets are securely routed through Paystack. Tickets purchased on OakTix contain custom, fraud-resistant QR codes that are scanned by event organizers or authorized staff for event entry. Refund policies are set by individual event organizers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">3. Organiser Responsibilities</h2>
            <p>
              Event organizers are solely responsible for the planning, execution, and security of their respective events. Organizers must maintain accurate details regarding event dates, locations, ticket tiers, and pricing.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
