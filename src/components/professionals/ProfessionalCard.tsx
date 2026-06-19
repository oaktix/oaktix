import Link from "next/link";
import { MapPin, Star, BadgeCheck, Flame, Clock, TrendingUp } from "lucide-react";
import type { Professional } from "@/lib/professionals/types";
import { PRICING_TYPE_LABELS } from "@/lib/professionals/types";

interface ProfessionalCardProps {
  professional: Professional;
  view?: "grid" | "list";
}

export default function ProfessionalCard({
  professional: p,
  view = "grid",
}: ProfessionalCardProps) {
  if (view === "list") {
    return (
      <Link href={`/professionals/${p.slug}`} className="block group">
        <div className="glass-card flex flex-col sm:flex-row gap-4 p-4 hover:border-indigo-500/30 hover:shadow-md transition-all duration-300">
          {/* Photo */}
          <div className="relative w-full sm:w-24 h-32 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            {p.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.profile_photo}
                alt={p.professional_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-500/10">
                <span className="text-3xl">{p.category?.icon ?? "🎯"}</span>
              </div>
            )}
            {p.verified && (
              <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-0.5">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">
                    {p.professional_name}
                  </h3>
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                      <Flame className="w-2.5 h-2.5" /> Featured
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-500 font-semibold mt-0.5">
                  {p.category?.name} · {p.years_of_experience}yr{p.years_of_experience !== 1 ? "s" : ""} exp
                </p>
              </div>
              <div className="text-right">
                {p.starting_price ? (
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">From</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      ₦{p.starting_price.toLocaleString()}
                    </span>
                    <span className="text-zinc-400 text-[10px]"> / {PRICING_TYPE_LABELS[p.pricing_type]}</span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium">Negotiable</span>
                )}
              </div>
            </div>

            {p.headline && (
              <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">{p.headline}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {(p.city || p.state) && (
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  {[p.city, p.state].filter(Boolean).join(", ")}
                </span>
              )}
              <RatingStars rating={p.average_rating} count={p.total_reviews} />
              <Badges p={p} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // GRID VIEW
  return (
    <Link href={`/professionals/${p.slug}`} className="block group h-full">
      <div className="glass-card overflow-hidden flex flex-col h-full hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
        {/* Cover / Profile Photo */}
        <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
          {p.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.cover_image}
              alt={`${p.professional_name} cover`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-amber-500/10">
              <span className="text-5xl opacity-40">{p.category?.icon ?? "🎯"}</span>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
              {p.category?.icon} {p.category?.name}
            </span>
          </div>

          {/* Featured badge */}
          {p.featured && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                <Flame className="w-3 h-3" /> Featured
              </span>
            </div>
          )}

          {/* Profile photo circle */}
          <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 overflow-hidden shadow-md">
            {p.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.profile_photo}
                alt={p.professional_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center">
                <span className="text-xl">{p.category?.icon ?? "🎯"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="pt-8 pb-4 px-4 flex-1 flex flex-col">
          {/* Name + Verified */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors leading-tight line-clamp-1">
              {p.professional_name}
            </h3>
            {p.verified && (
              <BadgeCheck className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* Headline */}
          {p.headline && (
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-2">
              {p.headline}
            </p>
          )}

          {/* Location + Rating */}
          <div className="flex flex-wrap items-center gap-2 mt-auto">
            {(p.city || p.state) && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span className="line-clamp-1">{[p.city, p.state].filter(Boolean).join(", ")}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8EBE7] dark:border-white/5">
            <RatingStars rating={p.average_rating} count={p.total_reviews} />
            <div className="text-right">
              {p.starting_price ? (
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase tracking-wider leading-none">From</span>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    ₦{p.starting_price.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-400 italic">Negotiable</span>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            <Badges p={p} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function RatingStars({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  if (count === 0) {
    return <span className="text-[10px] text-zinc-400 italic">No reviews yet</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
        {rating.toFixed(1)}
      </span>
      <span className="text-[10px] text-zinc-400">({count})</span>
    </div>
  );
}

function Badges({ p }: { p: Professional }) {
  return (
    <>
      {p.top_rated && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 uppercase tracking-wide">
          <Star className="w-2.5 h-2.5" /> Top Rated
        </span>
      )}
      {p.most_booked && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 uppercase tracking-wide">
          <TrendingUp className="w-2.5 h-2.5" /> Most Booked
        </span>
      )}
      {p.fast_responder && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 uppercase tracking-wide">
          <Clock className="w-2.5 h-2.5" /> Fast Response
        </span>
      )}
      {p.new_professional && !p.top_rated && !p.most_booked && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 uppercase tracking-wide">
          New
        </span>
      )}
    </>
  );
}
