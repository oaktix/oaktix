import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, LayoutGrid, List, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProfessionalCard from "@/components/professionals/ProfessionalCard";
import ProfessionalFilters from "@/components/professionals/ProfessionalFilters";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getProfessionals } from "@/lib/professionals/queries";

export const metadata: Metadata = {
  title: "Event Professionals Directory | OakTix",
  description:
    "Find and hire Nigeria's top event professionals: MCs, DJs, Photographers, Caterers, Decorators, and more. Browse verified profiles, check ratings, and contact directly.",
  openGraph: {
    title: "Event Professionals Directory | OakTix",
    description: "Find and hire Nigeria's top event professionals.",
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    state?: string;
    min_rating?: string;
    max_price?: string;
    verified?: string;
    featured?: string;
    sort?: string;
    page?: string;
    view?: string;
  }>;
}

export default async function ProfessionalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = Number(params.page ?? "1");
  const view = (params.view ?? "grid") as "grid" | "list";

  const [categories, { professionals, total, hasMore }] = await Promise.all([
    getCategories(),
    getProfessionals({
      search: params.search,
      category_slug: params.category,
      state: params.state,
      min_rating: params.min_rating ? Number(params.min_rating) : undefined,
      max_price: params.max_price ? Number(params.max_price) : undefined,
      verified: params.verified === "true",
      featured: params.featured === "true",
      sort: (params.sort as "rating" | "most_popular" | "newest" | "most_reviewed" | "price_asc" | "price_desc") ?? "most_popular",
      page,
      limit: 20,
    }),
  ]);

  const activeCategoryLabel = params.category
    ? categories.find((c) => c.slug === params.category)?.name
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b]">
      <Navbar user={user} theme="light" />

      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-[#0E4B31] pt-28 pb-16 px-6 md:px-12">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=80"
            alt="Event professionals"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E4B31]/90 to-[#0E4B31]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-xs font-bold text-amber-300 mb-5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Event Professionals Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight mb-4">
            Find the perfect{" "}
            <span className="text-amber-500">event professional</span>
          </h1>
          <p className="text-zinc-300 text-base sm:text-lg max-w-2xl mx-auto mb-4">
            Browse {total > 0 ? `${total}+` : "Nigeria's top"} verified event professionals — MCs, DJs, Caterers, Photographers, Decorators, and more.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs font-bold text-white/70 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" /> {total}+ Professionals
            </span>
            <span className="flex items-center gap-1.5">✓ Verified Profiles</span>
            <span className="flex items-center gap-1.5">✓ Direct Contact</span>
            <span className="flex items-center gap-1.5">✓ Free to Contact</span>
          </div>
        </div>
      </div>

      {/* Category Quick Filters */}
      <div className="bg-white dark:bg-zinc-900 border-b border-[#E8EBE7] dark:border-white/5 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/professionals"
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              !params.category
                ? "bg-indigo-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-500"
            }`}
          >
            All
          </Link>
          {categories.slice(0, 12).map((cat) => (
            <Link
              key={cat.id}
              href={`/professionals/${cat.slug}`}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                params.category === cat.slug
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-500"
              }`}
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-12 py-10">
        {/* Filters */}
        <Suspense>
          <ProfessionalFilters categories={categories} initialCategory={params.category} />
        </Suspense>

        {/* Results header */}
        <div className="flex items-center justify-between mt-8 mb-6">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
              {activeCategoryLabel ? `${activeCategoryLabel}s` : "All Professionals"}
              <span className="ml-2 text-sm font-normal text-zinc-400">({total} found)</span>
            </h2>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <Link
              href={`?${new URLSearchParams({ ...params, view: "grid" }).toString()}`}
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-white/50"}`}
            >
              <LayoutGrid className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </Link>
            <Link
              href={`?${new URLSearchParams({ ...params, view: "list" }).toString()}`}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-white/50"}`}
            >
              <List className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </Link>
          </div>
        </div>

        {/* Results Grid/List */}
        {professionals.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white dark:bg-zinc-900 border border-[#E8EBE7] dark:border-white/5 rounded-3xl">
            <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2 text-lg">No professionals found</h3>
            <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
              Try adjusting your filters or search for a different category or location.
            </p>
            <Link
              href="/professionals"
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
            >
              Clear Filters
            </Link>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {professionals.map((p) => (
              <ProfessionalCard key={p.id} professional={p} view="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {professionals.map((p) => (
              <ProfessionalCard key={p.id} professional={p} view="list" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div className="flex items-center justify-center gap-3 mt-12">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm text-zinc-400">Page {page}</span>
            {hasMore && (
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
              >
                Next →
              </Link>
            )}
          </div>
        )}

        {/* Register CTA */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-[#0E4B31] to-[#0B3F29] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white text-center sm:text-left">
            <h3 className="text-xl font-bold mb-1">Are you an event professional?</h3>
            <p className="text-indigo-100 text-sm">Join thousands of professionals already on OakTix.</p>
          </div>
          <Link
            href="/professionals/register"
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/20 group"
          >
            Create Your Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </main>

      <Footer theme="light" />
    </div>
  );
}
