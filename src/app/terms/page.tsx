import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Terms of Service – OakTix",
  description: "OakTix terms of service outlining user responsibilities and platform policies.",
  openGraph: {
    title: "Terms of Service – OakTix",
    description: "OakTix terms of service outlining user responsibilities and platform policies.",
    images: [{ url: "/logo-header.png", width: 1200, height: 630, alt: "OakTix" }],
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service – OakTix",
    description: "OakTix terms of service outlining user responsibilities and platform policies.",
    images: ["/logo-header.png"]
  }
});

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full pt-32 pb-24 px-6 relative space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading text-indigo-500 tracking-tight">Terms of Service</h1>
          <p className="text-zinc-500 text-sm mt-2">Last Updated: May 2026</p>
        </div>

        <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
          <p>
            Welcome to OakTix. By using our website, services, or mobile applications, you agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before accessing or using our platform.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">1. Introduction</h2>
            <p>
              OakTix provides an online platform that enables users to discover, share, and purchase tickets to events, and allows event organizers and vendors to create, promote, and sell tickets to their events.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">2. Account Registration</h2>
            <p>
              To access certain features of the platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to keep your account credentials secure. You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">3. Ticket Purchases and Payment Processing</h2>
            <p>
              All ticket transactions on OakTix are securely routed and processed through our payment gateway provider, Transactpay. By purchasing a ticket, you agree to pay the listed ticket price plus any applicable service fees. 
            </p>
            <p>
              Please note that Transactpay charges a standard payment processing fee of 1.3 percent on all ticket purchase transactions. This fee is automatically calculated during the checkout process.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">4. Vendor Payouts and Withdrawals</h2>
            <p>
              Event organizers and vendors can request payouts of their cleared ticket sales earnings directly to their linked Nigerian bank accounts through the financial overview panel.
            </p>
            <p>
              For each withdrawal transaction processed on our platform, a flat fee of 50 Naira (₦50) will be charged to cover administrative and banking network costs. This withdrawal charge is deducted automatically from the payout request amount.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">5. Cancellations, Postponements, and Refunds</h2>
            <p>
              Refund policies are set and managed entirely by the individual event organizers. OakTix does not establish refund timelines, nor do we issue automatic refunds. In the event of a cancellation or postponement, buyers must contact the event organizer directly to initiate refund procedures.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">6. User Conduct and Responsibilities</h2>
            <p>
              You agree not to use the platform for any illegal purpose or in any way that violates these terms. Event organizers must ensure that all event details, descriptions, locations, and ticket availability limits are accurate and do not mislead customers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">7. Limitation of Liability</h2>
            <p>
              OakTix is a venue hosting and ticketing software. We are not responsible for the actual hosting, execution, quality, safety, or legality of any event promoted on the platform. Any issues arising from the event itself are solely between the ticket buyer and the event organizer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">8. Contact Information</h2>
            <p>
              If you have any questions or feedback regarding these terms, please contact us at:
            </p>
            <p className="font-semibold text-zinc-800">
              Email: hello@oaktix.com.ng<br />
              Location: Ibadan, Nigeria
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
