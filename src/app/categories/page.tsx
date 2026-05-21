import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Categories – OakTix",
  description: "Browse events by category on OakTix.",
  openGraph: {
    title: "Categories – OakTix",
    description: "Browse events by category on OakTix.",
    images: [{ url: "/logo-header.png", width: 1200, height: 630, alt: "OakTix" }],
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL
  },
  twitter: {
    card: "summary_large_image",
    title: "Categories – OakTix",
    description: "Browse events by category on OakTix.",
    images: ["/logo-header.png"]
  }
});
import Link from "next/link";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch actual events from the database to count them by category
  const { data: dbEvents } = await supabase
    .from("events")
    .select("category");

  const categoryCounts: Record<string, number> = {};
  if (dbEvents) {
    dbEvents.forEach((event) => {
      const cat = event.category || "Other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  }

  const defaultCategories = [
    { label: "Concerts", emoji: "🎤" },
    { label: "Conferences", emoji: "🎯" },
    { label: "Festivals", emoji: "🎉" },
    { label: "Sports", emoji: "⚽" },
    { label: "Theatre", emoji: "🎭" },
    { label: "Comedy", emoji: "😂" },
    { label: "Workshops", emoji: "🛠️" },
    { label: "Parties", emoji: "🥳" },
  ];

  const categories = defaultCategories.map(cat => {
    const count = categoryCounts[cat.label] || 0;
    return {
      ...cat,
      count: `${count} ${count === 1 ? 'event' : 'events'}`
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-zinc-900 overflow-hidden">
      {/* Header */}
      <Navbar user={user} theme="light" />

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full pt-32 pb-24 px-6 relative">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-indigo-500 tracking-tight">Browse by category</h1>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">Find exactly what you are looking for</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Link 
              href={`/events?category=${cat.label}`} 
              key={i} 
              className="glass-card p-8 text-center hover:border-indigo-500/30 transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/5 group flex flex-col items-center justify-center bg-white border-[#E8EBE7]"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.emoji}</div>
              <h4 className="font-bold text-base text-zinc-800">{cat.label}</h4>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mt-2">{cat.count}</span>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer theme="light" />
    </div>
  );
}
