"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";

interface TicketType {
  name: string;
  price: number;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  start_date: string;
  price_naira?: number | null;
  slug: string;
  category: string;
  image_url?: string | null;
  featured_image?: string | null;
  ticket_types?: TicketType[] | null;
}

interface LatestEventsCarouselProps {
  events: EventItem[];
}

export default function LatestEventsCarousel({ events }: LatestEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (events.length > 0 ? (prev + 1) % events.length : 0));
  }, [events.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (events.length > 0 ? (prev - 1 + events.length) % events.length : 0));
  }, [events.length]);

  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
    autoplayRef.current = setInterval(nextSlide, 5000);
  }, [nextSlide]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [resetAutoplay]);

  if (!events || events.length === 0) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-zinc-950 border border-white/10 group shadow-2xl">
      {/* Slides Container */}
      <div className="w-full h-full relative">
        {events.map((event, idx) => {
          const banner = event.image_url || event.featured_image;
          const date = event.start_date ? new Date(event.start_date) : null;
          const formattedDate = date
            ? date.toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Coming Soon";

          const minPrice =
            event.price_naira ??
            (event.ticket_types && event.ticket_types.length > 0
              ? Math.min(...event.ticket_types.map((t) => t.price))
              : 0);

          const isActive = idx === currentIndex;

          return (
            <div
              key={event.id || idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Background Image / Gradient */}
              {banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner}
                  alt={event.title}
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-[1.02] transition-transform duration-[8000ms]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-[#0E4B31] to-zinc-950" />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

              {/* Slide Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 flex flex-col justify-end text-white">
                <div className="max-w-2xl space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-indigo-500 border border-indigo-400/30 text-white">
                    {event.category}
                  </span>

                  <h2 className="text-2xl md:text-4xl font-extrabold font-heading tracking-tight drop-shadow-md line-clamp-2">
                    {event.title}
                  </h2>

                  <p className="text-zinc-300 text-xs md:text-sm line-clamp-2 drop-shadow leading-relaxed">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-200">
                    <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      {formattedDate}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10 w-full">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
                      Tickets starting from
                    </span>
                    <span className="text-lg md:text-2xl font-black font-heading text-white">
                      ₦{minPrice.toLocaleString()}
                    </span>
                  </div>
                  <Link
                    href={`/events/${event.slug}`}
                    className="px-6 md:px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs md:text-sm transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Get Tickets
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={() => {
              prevSlide();
              resetAutoplay();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-xl bg-black/50 hover:bg-indigo-500 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              nextSlide();
              resetAutoplay();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-xl bg-black/50 hover:bg-indigo-500 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {events.length > 1 && (
        <div className="absolute bottom-4 right-6 md:right-12 z-30 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
          {events.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                resetAutoplay();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-6 bg-indigo-500" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
