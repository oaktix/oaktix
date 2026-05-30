"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Ticket } from "lucide-react";

interface TicketType {
  name: string;
  price: number;
  early_bird_price?: number | null;
  early_bird_capacity?: number | null;
  description?: string;
  perks?: string[];
  is_closed?: boolean;
  capacity?: number;
  sold_count?: number;
  early_bird_until?: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Drag to scroll states (for desktop users who don't have a touch screen)
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScrollLimits = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    // Allow small tolerance for fractional rendering differences
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Check initial state
    checkScrollLimits();

    el.addEventListener("scroll", checkScrollLimits);
    window.addEventListener("resize", checkScrollLimits);

    return () => {
      el.removeEventListener("scroll", checkScrollLimits);
      window.removeEventListener("resize", checkScrollLimits);
    };
  }, [events]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    // Scroll by the width of one card plus gap (approx 340px)
    const scrollAmount = direction === "left" ? -340 : 340;
    el.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5; // scroll speed multiplier
    el.scrollLeft = scrollLeft - walk;
  };

  if (!events || events.length === 0) return null;

  return (
    <div className="relative w-full group">
      {/* Navigation Arrows */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white text-zinc-900 border border-zinc-200 shadow-lg hover:bg-indigo-500 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white text-zinc-900 border border-zinc-200 shadow-lg hover:bg-indigo-500 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Cards Scroll Container */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`w-full flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 select-none cursor-grab active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        style={{ scrollbarWidth: "none" }}
      >
        {events.map((event) => {
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

          return (
            <div
              key={event.id}
              className="w-[300px] sm:w-[340px] flex-shrink-0 snap-start bg-white border border-[#E8EBE7] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col group/card"
            >
              {/* Event Cover Image */}
              <div className="h-48 relative overflow-hidden bg-zinc-100 border-b border-[#E8EBE7]">
                {banner ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={banner}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-amber-500/20 flex items-center justify-center p-6 group-hover/card:scale-105 transition-transform duration-500">
                    <Ticket className="w-12 h-12 text-indigo-500/40" />
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-indigo-500 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm">
                  {event.category}
                </span>
              </div>

              {/* Card Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-500 text-xs font-bold mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 font-heading text-zinc-900 group-hover/card:text-indigo-500 transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-zinc-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  {event.location && (
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium mb-4">
                      <MapPin className="w-3.5 h-3.5 text-rose-500/70" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Price and Action Button */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8EBE7]">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Tickets from</span>
                    <span className="text-base font-extrabold text-zinc-900">
                      {minPrice > 0 ? `₦${minPrice.toLocaleString()}` : "Free"}
                    </span>
                  </div>
                  <Link
                    href={`/events/${event.slug}`}
                    className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs group-hover/card:bg-indigo-500 group-hover/card:text-white transition-all cursor-pointer"
                  >
                    Book Tickets
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
