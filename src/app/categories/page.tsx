import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const categories = [
    { label: "Concerts", emoji: "🎤", count: "0 events" },
    { label: "Conferences", emoji: "🎯", count: "1 event" },
    { label: "Festivals", emoji: "🎉", count: "1 event" },
    { label: "Sports", emoji: "⚽", count: "1 event" },
    { label: "Theatre", emoji: "🎭", count: "0 events" },
    { label: "Comedy", emoji: "😂", count: "1 event" },
    { label: "Workshops", emoji: "🛠️", count: "1 event" },
    { label: "Parties", emoji: "🥳", count: "0 events" },
  ];

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
