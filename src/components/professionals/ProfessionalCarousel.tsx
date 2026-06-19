"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BadgeCheck, Star, MapPin, Flame } from "lucide-react";
import type { Professional, ProfessionalCategory } from "@/lib/professionals/types";

interface ProfessionalCarouselProps {
  category: ProfessionalCategory;
  professionals: Professional[];
}

export default function ProfessionalCarousel({
  category,
  professionals,
}: ProfessionalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkLimits = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkLimits();
    el.addEventListener("scroll", checkLimits);
    window.addEventListener("resize", checkLimits);
    return () => {
      el.removeEventListener("scroll", checkLimits);
      window.removeEventListener("resize", checkLimits);
    };
  }, [professionals]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  if (professionals.length === 0) return null;

  return (
    <div className="w-full mb-20">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <h3 className="text-xl font-bold font-heading text-zinc-900 dark:text-zinc-100">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-xs text-zinc-500 mt-0.5">{category.description}</p>
            )}
          </div>
        </div>
        <Link
          href={`/professionals/${category.slug}`}
          className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors text-sm font-bold group"
        >
          View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative group/carousel">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-[-14px] top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          onMouseDown={(e) => {
            const el = scrollRef.current;
            if (!el) return;
            setIsDragging(true);
            setStartX(e.pageX - el.offsetLeft);
            setScrollLeft(el.scrollLeft);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (!isDragging) return;
            e.preventDefault();
            const el = scrollRef.current;
            if (!el) return;
            const x = e.pageX - el.offsetLeft;
            el.scrollLeft = scrollLeft - (x - startX) * 1.5;
          }}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: "none" }}
        >
          {professionals.map((p) => (
            <Link
              key={p.id}
              href={`/professionals/${p.slug}`}
              className="flex-shrink-0 w-[240px] sm:w-[260px] snap-start group/card"
              draggable={false}
            >
              <div className="bg-white dark:bg-zinc-900 border border-[#E8EBE7] dark:border-white/8 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-indigo-500/30 transition-all duration-300 h-full flex flex-col">
                {/* Photo */}
                <div className="relative h-36 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                  {p.cover_image || p.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.cover_image || p.profile_photo!}
                      alt={p.professional_name}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-amber-500/10">
                      <span className="text-4xl opacity-30">{category.icon}</span>
                    </div>
                  )}

                  {p.featured && (
                    <div className="absolute top-2 right-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold uppercase">
                        <Flame className="w-2.5 h-2.5" /> Hot
                      </span>
                    </div>
                  )}

                  {/* Avatar circle */}
                  {p.profile_photo && p.cover_image && (
                    <div className="absolute -bottom-4 left-3 w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden bg-zinc-200 shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.profile_photo} alt={p.professional_name} className="w-full h-full object-cover" draggable={false} />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className={`p-3 flex-1 flex flex-col ${p.profile_photo && p.cover_image ? "pt-6" : ""}`}>
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover/card:text-indigo-500 transition-colors line-clamp-1 leading-snug">
                      {p.professional_name}
                    </h4>
                    {p.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  {p.headline && (
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {p.headline}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-1">
                      {p.total_reviews > 0 ? (
                        <>
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                            {p.average_rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-zinc-400">({p.total_reviews})</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">New</span>
                      )}
                    </div>
                    <div className="text-right">
                      {p.starting_price ? (
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          ₦{p.starting_price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">Negotiable</span>
                      )}
                    </div>
                  </div>

                  {(p.city || p.state) && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" />
                      <span className="text-[10px] text-zinc-400 line-clamp-1">
                        {[p.city, p.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
