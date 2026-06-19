import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck, Flame, Star, MapPin, Phone, Mail, Globe,
  MessageCircle, Instagram, Facebook, Youtube, Clock, Award,
  Users, TrendingUp, ChevronRight, ArrowLeft, ExternalLink,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProfessionalCard from "@/components/professionals/ProfessionalCard";
import ProfessionalPortfolioGallery from "@/components/professionals/ProfessionalPortfolioGallery";
import ProfessionalInquiryForm from "@/components/professionals/ProfessionalInquiryForm";
import ProfessionalReviews from "@/components/professionals/ProfessionalReviews";
import ProfessionalFilters from "@/components/professionals/ProfessionalFilters";
import { createClient } from "@/lib/supabase/server";
import {
  getProfessionalBySlug,
  getCategoryBySlug,
  getProfessionals,
  getRelatedProfessionals,
  getCategories,
} from "@/lib/professionals/queries";
import { PRICING_TYPE_LABELS } from "@/lib/professionals/types";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    state?: string;
    min_rating?: string;
    max_price?: string;
    verified?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Try category first
  const category = await getCategoryBySlug(slug);
  if (category) {
    return {
      title: `${category.name} in Nigeria | OakTix Professionals`,
      description: `Hire top ${category.name} in Nigeria. Browse verified profiles, portfolios, reviews, and contact directly.`,
    };
  }

  // Try professional
  const professional = await getProfessionalBySlug(slug);
  if (professional) {
    return {
      title: `${professional.professional_name} — ${professional.category?.name ?? "Professional"} | OakTix`,
      description:
        professional.headline ??
        `${professional.professional_name} is a professional ${professional.category?.name ?? "event professional"} based in ${professional.city ?? "Nigeria"}.`,
      openGraph: {
        title: `${professional.professional_name} | OakTix Professionals`,
        description: professional.headline ?? "",
        images: professional.profile_photo ? [{ url: professional.profile_photo }] : [],
        type: "profile",
      },
    };
  }

  return { title: "Professional | OakTix" };
}

export default async function ProfessionalSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Try: Is this a CATEGORY slug? ──────────────────────────
  const category = await getCategoryBySlug(slug);

  if (category) {
    const page = Number(sp.page ?? "1");
    const [allCategories, { professionals, total, hasMore }] = await Promise.all([
      getCategories(),
      getProfessionals({
        category_slug: slug,
        search: sp.search,
        state: sp.state,
        min_rating: sp.min_rating ? Number(sp.min_rating) : undefined,
        max_price: sp.max_price ? Number(sp.max_price) : undefined,
        verified: sp.verified === "true",
        sort: (sp.sort as "rating" | "most_popular" | "newest" | "most_reviewed" | "price_asc" | "price_desc") ?? "most_popular",
        page,
        limit: 20,
      }),
    ]);

    return (
      <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b]">
        <Navbar user={user} theme="light" />

        {/* Category Hero */}
        <div className="bg-[#0E4B31] pt-28 pb-14 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-indigo-200/60 text-xs font-medium mb-4">
              <Link href="/professionals" className="hover:text-white transition-colors">Professionals</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">{category.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{category.icon}</span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-indigo-100/80 text-sm mt-1.5 max-w-xl">{category.description}</p>
                )}
                <p className="text-indigo-200/60 text-xs mt-2">{total} professional{total !== 1 ? "s" : ""} available</p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-12 py-10">
          <Suspense>
            <ProfessionalFilters categories={allCategories} initialCategory={slug} />
          </Suspense>

          <div className="mt-8">
            {professionals.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-[#E8EBE7] dark:border-white/5 rounded-3xl">
                <span className="text-4xl block mb-4">{category.icon}</span>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">No {category.name} found yet</h3>
                <p className="text-zinc-400 text-sm mb-6">Be the first to register in this category!</p>
                <Link
                  href="/professionals/register"
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
                >
                  Register as a {category.name.slice(0, -1)}
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {professionals.map((p) => (
                    <ProfessionalCard key={p.id} professional={p} view="grid" />
                  ))}
                </div>
                {(page > 1 || hasMore) && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    {page > 1 && (
                      <Link href={`?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`} className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 font-bold text-sm hover:bg-zinc-50 transition-all">← Previous</Link>
                    )}
                    <span className="text-sm text-zinc-400">Page {page}</span>
                    {hasMore && (
                      <Link href={`?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`} className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all">Next →</Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <Footer theme="light" />
      </div>
    );
  }

  // ── Try: Is this a PROFESSIONAL slug? ──────────────────────
  const professional = await getProfessionalBySlug(slug);
  if (!professional) notFound();

  const relatedProfessionals = await getRelatedProfessionals(
    professional.id,
    professional.category_id ?? "",
    professional.city,
    4
  );

  const hasContactInfo = professional.phone || professional.whatsapp || professional.email || professional.website;
  const hasSocialMedia = professional.instagram || professional.facebook || professional.twitter || professional.youtube || professional.tiktok;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#09090b]">
      <Navbar user={user} theme="light" />

      {/* Hero / Cover */}
      <div className="relative w-full h-64 sm:h-80 bg-zinc-900 overflow-hidden mt-16">
        {professional.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={professional.cover_image} alt="Cover" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-amber-500/20 flex items-center justify-center">
            <span className="text-8xl opacity-20">{professional.category?.icon ?? "🎯"}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-6 flex items-center gap-2 text-white/60 text-xs font-medium">
          <Link href="/professionals" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Professionals
          </Link>
          <ChevronRight className="w-3 h-3" />
          {professional.category && (
            <>
              <Link href={`/professionals/${professional.category.slug}`} className="hover:text-white transition-colors">
                {professional.category.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-white">{professional.professional_name}</span>
        </div>
      </div>

      {/* Profile Info Bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-[#E8EBE7] dark:border-white/8 px-6 md:px-12 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-5 sm:items-end">
            {/* Profile photo */}
            <div className="relative -mt-16 flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 overflow-hidden shadow-xl">
                {professional.profile_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={professional.profile_photo} alt={professional.professional_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/10">
                    <span className="text-4xl">{professional.category?.icon ?? "🎯"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-zinc-900 dark:text-white">
                      {professional.professional_name}
                    </h1>
                    {professional.verified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                    {professional.featured && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
                        <Flame className="w-3.5 h-3.5" /> Featured
                      </span>
                    )}
                  </div>
                  {professional.business_name && (
                    <p className="text-zinc-500 text-sm">{professional.business_name}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm">
                {professional.category && (
                  <Link href={`/professionals/${professional.category.slug}`} className="text-indigo-500 font-semibold hover:text-indigo-600 transition-colors">
                    {professional.category.icon} {professional.category.name}
                  </Link>
                )}
                {(professional.city || professional.state) && (
                  <span className="flex items-center gap-1 text-zinc-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {[professional.city, professional.state].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {professional.years_of_experience} yr{professional.years_of_experience !== 1 ? "s" : ""} experience
                </span>
                {professional.total_reviews > 0 && (
                  <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <strong>{professional.average_rating.toFixed(1)}</strong>
                    <span className="text-zinc-400">({professional.total_reviews} reviews)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Pricing */}
            {professional.starting_price && (
              <div className="flex-shrink-0 text-right sm:pb-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Starting from</span>
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                  ₦{professional.starting_price.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-400 block">
                  {PRICING_TYPE_LABELS[professional.pricing_type]}
                </span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-[#E8EBE7] dark:border-white/5">
            {[
              { icon: <Users className="w-4 h-4" />, value: professional.total_bookings, label: "Bookings" },
              { icon: <Star className="w-4 h-4 text-amber-500" />, value: professional.total_reviews, label: "Reviews" },
              { icon: <TrendingUp className="w-4 h-4" />, value: professional.profile_views, label: "Profile Views" },
              { icon: <Award className="w-4 h-4" />, value: professional.years_of_experience + " yrs", label: "Experience" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 text-zinc-500">
                <span className="text-zinc-400">{stat.icon}</span>
                <span className="font-bold text-zinc-900 dark:text-white">{stat.value}</span>
                <span className="text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left — Main content */}
          <div className="lg:col-span-2 space-y-12">

            {/* About */}
            {professional.bio && (
              <section>
                <h2 className="text-xl font-bold font-heading text-zinc-900 dark:text-white mb-4">About</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {professional.bio}
                  </p>
                </div>
              </section>
            )}

            {/* Portfolio */}
            {professional.portfolio && professional.portfolio.length > 0 && (
              <section>
                <h2 className="text-xl font-bold font-heading text-zinc-900 dark:text-white mb-4">Portfolio</h2>
                <ProfessionalPortfolioGallery portfolio={professional.portfolio} />
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="text-xl font-bold font-heading text-zinc-900 dark:text-white mb-4">
                Reviews
                {professional.total_reviews > 0 && (
                  <span className="ml-2 text-sm font-normal text-zinc-400">({professional.total_reviews})</span>
                )}
              </h2>
              <ProfessionalReviews
                professionalId={professional.id}
                professionalName={professional.professional_name}
                reviews={professional.reviews ?? []}
                averageRating={professional.average_rating}
                totalReviews={professional.total_reviews}
              />
            </section>
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-6">

            {/* Contact Buttons */}
            {hasContactInfo && (
              <div className="glass-card p-5 space-y-3">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Contact</h3>
                {professional.whatsapp && (
                  <a
                    href={`https://wa.me/${professional.whatsapp.replace(/\D/g, "")}?text=Hello ${encodeURIComponent(professional.professional_name)}, I found your profile on OakTix and I'd like to discuss an event.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                  </a>
                )}
                {professional.phone && (
                  <a
                    href={`tel:${professional.phone}`}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold text-sm transition-all"
                  >
                    <Phone className="w-4 h-4 text-indigo-500" /> Call
                  </a>
                )}
                {professional.email && (
                  <a
                    href={`mailto:${professional.email}?subject=Inquiry from OakTix`}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold text-sm transition-all"
                  >
                    <Mail className="w-4 h-4 text-indigo-500" /> Email
                  </a>
                )}
                {professional.website && (
                  <a
                    href={professional.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold text-sm transition-all"
                  >
                    <Globe className="w-4 h-4 text-indigo-500" /> Website <ExternalLink className="w-3 h-3 ml-auto text-zinc-400" />
                  </a>
                )}
              </div>
            )}

            {/* Social Media */}
            {hasSocialMedia && (
              <div className="glass-card p-5">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-3">Social Media</h3>
                <div className="flex flex-wrap gap-2">
                  {professional.instagram && (
                    <a href={`https://instagram.com/${professional.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold hover:opacity-90 transition-opacity">
                      <Instagram className="w-3.5 h-3.5" /> Instagram
                    </a>
                  )}
                  {professional.facebook && (
                    <a href={professional.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:opacity-90 transition-opacity">
                      <Facebook className="w-3.5 h-3.5" /> Facebook
                    </a>
                  )}
                  {professional.youtube && (
                    <a href={professional.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:opacity-90 transition-opacity">
                      <Youtube className="w-3.5 h-3.5" /> YouTube
                    </a>
                  )}
                  {professional.tiktok && (
                    <a href={`https://tiktok.com/@${professional.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:opacity-90 transition-opacity">
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Inquiry Form */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-4">
                Send an Inquiry
              </h3>
              <ProfessionalInquiryForm
                professionalId={professional.id}
                professionalName={professional.professional_name}
              />
            </div>

            {/* Trust Signals */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-3">Credentials</h3>
              <div className="space-y-2.5">
                {professional.verified && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <BadgeCheck className="w-4 h-4" />
                    <span className="font-medium">Verified Professional</span>
                  </div>
                )}
                {professional.top_rated && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span className="font-medium">Top Rated</span>
                  </div>
                )}
                {professional.most_booked && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Most Booked</span>
                  </div>
                )}
                {professional.fast_responder && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Fast Responder</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Award className="w-4 h-4" />
                  <span>{professional.years_of_experience} years of experience</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Users className="w-4 h-4" />
                  <span>{professional.total_bookings} completed bookings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Professionals */}
        {relatedProfessionals.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl font-bold font-heading text-zinc-900 dark:text-white">
                Similar {professional.category?.name ?? "Professionals"}
              </h2>
              {professional.category && (
                <Link
                  href={`/professionals/${professional.category.slug}`}
                  className="text-sm text-indigo-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-1 group"
                >
                  View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProfessionals.map((p) => (
                <ProfessionalCard key={p.id} professional={p} view="grid" />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer theme="light" />
    </div>
  );
}
