import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full pt-32 pb-24 px-6 relative space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading text-indigo-500 tracking-tight">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm mt-2">Last Updated: May 2026</p>
        </div>

        <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">1. Information We Collect</h2>
            <p>
              We collect basic registration details (name, email address, phone number) when you purchase a ticket or register as an event organizer. Transaction data is safely handled by Transactpay.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">2. How We Use Information</h2>
            <p>
              Your contact information is used strictly to deliver purchase receipts, generate secure entry QR codes, provide transaction status, and send important organizer updates regarding events you are attending.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">3. Security</h2>
            <p>
              All customer, ticket, and database entries are safely mapped with strict Row Level Security (RLS) policies inside Supabase to prevent unauthorized access or modification.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
