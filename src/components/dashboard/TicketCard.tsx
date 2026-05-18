"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, MapPin, Download, Share2, QrCode, ChevronDown, ChevronUp, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TicketCardProps {
  ticket: {
    id?: string;
    unique_code?: string;
    status?: string;
    event_id?: string;
    buyer_id?: string;
    ticket_type?: { name: string };
    qr_code_url?: string;
    events?: {
      id?: string;
      title?: string;
      start_date?: string;
      featured_image?: string;
      slug?: string;
      venue_details?: { name?: string; address?: string };
    };
  };
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const supabase = createClient();

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.event_id || !ticket.buyer_id) {
      setReviewError("Missing ticket parameters. Unable to post review.");
      return;
    }
    setIsSubmittingReview(true);
    setReviewError(null);

    const { error } = await supabase
      .from("reviews")
      .insert({
        event_id: ticket.event_id,
        user_id: ticket.buyer_id,
        rating: rating,
        comment: comment,
        is_anonymous: isAnonymous
      });

    setIsSubmittingReview(false);
    if (error) {
      setReviewError(error.message);
    } else {
      setReviewSubmitted(true);
    }
  };

  const event = ticket.events;

  // Ensure start_date is parsed correctly
  const startDate = event?.start_date ? new Date(event.start_date) : null;

  const handleDownloadIcs = () => {
    if (!startDate || !event) return;

    // Create a very simple .ics file format
    const formatIcsDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours long

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Oaktix//Oaktix Events//EN",
      "BEGIN:VEVENT",
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.venue_details?.name || "Virtual Event"} - ${event.venue_details?.address || ""}`,
      `URL:${window.location.origin}/events/${event.slug}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${event.slug}-event.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!event) return;
    const url = `${window.location.origin}/events/${event.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `I'm going to ${event.title}! Get your tickets now.`,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="glass-card overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
      <div className="flex flex-col md:flex-row">
        {/* Event Thumbnail */}
        <div className="w-full md:w-48 h-48 md:h-auto bg-zinc-800 relative shrink-0">
          {event?.featured_image ? (
            <Image 
              src={event.featured_image} 
              alt={event.title || "Event Image"} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black flex items-center justify-center">
              <span className="text-white/20 font-bold text-2xl">OAKTIX</span>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white uppercase">
            {ticket.status}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">
              {ticket.ticket_type?.name || "General Admission"}
            </p>
            <h3 className="text-2xl font-bold font-heading mb-2">{event?.title || "Unknown Event"}</h3>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>
                  {startDate ? format(startDate, "MMM do, yyyy 'at' p") : "TBA"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="line-clamp-1">{event?.venue_details?.name || "Virtual Event"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              {isExpanded ? "Hide Ticket" : "View Ticket"}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleDownloadIcs}
              aria-label="Add to Calendar"
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-zinc-300"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={handleShare}
              aria-label="Share Event"
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-zinc-300"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded QR Code Section */}
      {isExpanded && (
        <div className="border-t border-white/10 p-6 bg-white/5 flex flex-col items-stretch gap-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="bg-white p-4 rounded-xl shadow-2xl shrink-0">
              {ticket.qr_code_url ? (
                <Image 
                  src={ticket.qr_code_url} 
                  alt="Ticket QR Code" 
                  width={200} 
                  height={200} 
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 bg-zinc-100 flex items-center justify-center flex-col gap-2">
                  <QrCode className="w-12 h-12 text-zinc-300" />
                  <span className="text-zinc-400 text-xs text-center px-4">QR Code generating...</span>
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left space-y-4 flex-1">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ticket ID</p>
                <p className="text-xl font-mono font-bold tracking-widest text-white">{ticket.unique_code}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ticket Holder</p>
                <p className="text-lg font-bold text-white">You</p>
              </div>
              {startDate && startDate < new Date() ? (
                <div className="inline-block px-3 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  Event Concluded
                </div>
              ) : (
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Valid for Entry
                </div>
              )}
            </div>
          </div>

          {/* Past Event Reviews Module */}
          {startDate && startDate < new Date() && (
            <div className="border-t border-white/5 pt-6 mt-2">
              {reviewSubmitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center text-emerald-400 font-bold text-sm animate-in zoom-in duration-200">
                  ✓ Thank you! Your experience rating has been recorded successfully.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl mx-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-300">Rate your experience:</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          title={`Rate ${star} Stars`}
                          aria-label={`Rate ${star} Stars`}
                          className="focus:outline-none transition-transform active:scale-90"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "text-amber-400 fill-amber-400"
                                : "text-zinc-650"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="review-comment" className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Leave a comment (Optional)</label>
                    <textarea
                      id="review-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share what you loved or how the organizer can improve..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-sm font-semibold text-white resize-none placeholder:text-zinc-600 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-zinc-400">Post review anonymously</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingReview && <Star className="w-3.5 h-3.5 animate-spin" />}
                      Submit Review
                    </button>
                  </div>

                  {reviewError && (
                    <p className="text-xs text-rose-400 font-semibold">{reviewError}</p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
