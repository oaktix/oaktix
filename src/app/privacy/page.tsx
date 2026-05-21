import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Privacy Policy – OakTix",
  description: "OakTix privacy policy detailing data handling and user rights.",
  openGraph: {
    title: "Privacy Policy – OakTix",
    description: "OakTix privacy policy detailing data handling and user rights.",
    images: [{ url: "/logo-header.png", width: 1200, height: 630, alt: "OakTix" }],
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy – OakTix",
    description: "OakTix privacy policy detailing data handling and user rights.",
    images: ["/logo-header.png"]
  }
});

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

        <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
          <p>
            At OakTix, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our services and tell you about your privacy rights and how the law protects you.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">1. Information We Collect</h2>
            <p>
              We collect several types of information from and about users of our platform, including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Identity and Contact Data:</strong> Includes your first name, last name, email address, and phone number when you register an account, purchase tickets, or sign up as an event organizer.
              </li>
              <li>
                <strong>Transaction Data:</strong> Details about payments to and from you, and other details of tickets and services you have purchased on our platform. Payment transactions are securely routed and processed through Transactpay. We do not store full credit card details on our servers.
              </li>
              <li>
                <strong>Technical and Usage Data:</strong> Includes internet protocol (IP) address, login data, browser type and version, time zone setting, operating system and platform, and information about how you use our website and services.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">2. How We Use Your Information</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we use your data in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To register you as a new customer or event organizer.</li>
              <li>To process and deliver your ticket bookings, including sending booking confirmations, generating secure QR codes, and processing payments.</li>
              <li>To notify you about changes to our service or event updates.</li>
              <li>To enable event organizers to manage their events and verify ticket validity at the entrance.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">3. Third Party Services</h2>
            <p>
              We partner with secure third party services to operate our ticketing platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Supabase:</strong> Used for secure user authentication, database management, and media storage. All data is protected with strict Row Level Security (RLS) policies.
              </li>
              <li>
                <strong>Transactpay:</strong> Processes all secure payment transactions. Transaction data is securely handled by Transactpay in accordance with their privacy standards.
              </li>
              <li>
                <strong>Resend:</strong> Used to dispatch ticket confirmation emails containing QR codes.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. All database queries are filtered through strict user-level permissions, and data transmission is encrypted using Secure Sockets Layer (SSL) technology.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">5. Your Legal Rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, or transfer of your personal data. You can manage your profile details directly from the user dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">6. Cookies</h2>
            <p>
              Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-800 font-heading">7. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
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
