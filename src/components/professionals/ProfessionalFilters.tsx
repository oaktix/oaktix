"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { ProfessionalCategory } from "@/lib/professionals/types";
import { NIGERIAN_STATES } from "@/lib/professionals/types";

interface ProfessionalFiltersProps {
  categories: ProfessionalCategory[];
  initialCategory?: string;
}

const SORT_OPTIONS = [
  { value: "most_popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "most_reviewed", label: "Most Reviewed" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
];

export default function ProfessionalFilters({
  categories,
  initialCategory,
}: ProfessionalFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const getParam = (key: string) => searchParams.get(key) ?? "";

  const [search, setSearch] = useState(getParam("search"));
  const [category, setCategory] = useState(initialCategory ?? getParam("category"));
  const [state, setState] = useState(getParam("state"));
  const [minRating, setMinRating] = useState(getParam("min_rating"));
  const [maxPrice, setMaxPrice] = useState(getParam("max_price"));
  const [verified, setVerified] = useState(getParam("verified") === "true");
  const [featured, setFeatured] = useState(getParam("featured") === "true");
  const [sort, setSort] = useState(getParam("sort") || "most_popular");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (minRating) params.set("min_rating", minRating);
    if (maxPrice) params.set("max_price", maxPrice);
    if (verified) params.set("verified", "true");
    if (featured) params.set("featured", "true");
    if (sort && sort !== "most_popular") params.set("sort", sort);
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [search, category, state, minRating, maxPrice, verified, featured, sort, pathname, router]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setState("");
    setMinRating("");
    setMaxPrice("");
    setVerified(false);
    setFeatured(false);
    setSort("most_popular");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    search || category || state || minRating || maxPrice || verified || featured || sort !== "most_popular";

  return (
    <div className="w-full space-y-4">
      {/* Search + Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search professionals by name, location..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); }}
            className="appearance-none pl-4 pr-8 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
            showFilters || hasActiveFilters
              ? "bg-indigo-500 text-white border-indigo-500"
              : "bg-white dark:bg-zinc-900 border-[#E8EBE7] dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:border-indigo-500/30"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          )}
        </button>

        {/* Search Button */}
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-md shadow-indigo-500/10"
        >
          {isPending ? "..." : "Search"}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-5 bg-white dark:bg-zinc-900 border border-[#E8EBE7] dark:border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* State */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">State</label>
            <div className="relative">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="">All States</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Min Rating */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Min Rating</label>
            <div className="relative">
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="">Any Rating</option>
                <option value="4.5">⭐ 4.5+</option>
                <option value="4">⭐ 4.0+</option>
                <option value="3.5">⭐ 3.5+</option>
                <option value="3">⭐ 3.0+</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Max Budget (₦)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Toggles */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-4 pt-2 border-t border-[#E8EBE7] dark:border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Verified Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Featured Only</span>
            </label>

            <div className="ml-auto flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <FilterPill label={`Search: "${search}"`} onRemove={() => { setSearch(""); applyFilters(); }} />
          )}
          {category && (
            <FilterPill
              label={categories.find((c) => c.slug === category)?.name ?? category}
              onRemove={() => { setCategory(""); applyFilters(); }}
            />
          )}
          {state && <FilterPill label={state} onRemove={() => { setState(""); applyFilters(); }} />}
          {minRating && <FilterPill label={`${minRating}+ stars`} onRemove={() => { setMinRating(""); applyFilters(); }} />}
          {maxPrice && <FilterPill label={`Max ₦${Number(maxPrice).toLocaleString()}`} onRemove={() => { setMaxPrice(""); applyFilters(); }} />}
          {verified && <FilterPill label="Verified" onRemove={() => { setVerified(false); applyFilters(); }} />}
          {featured && <FilterPill label="Featured" onRemove={() => { setFeatured(false); applyFilters(); }} />}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-800 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
