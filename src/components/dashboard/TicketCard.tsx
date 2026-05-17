"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, MapPin, Download, Share2, QrCode, ChevronDown, ChevronUp } from "lucide-react";

interface TicketCardProps {
  ticket: {
    id?: string;
    unique_code?: string;
    status?: string;
    ticket_type?: { name: string };
    qr_code_url?: string;
    events?: {
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
        <div className="border-t border-white/10 p-6 bg-white/5 flex flex-col md:flex-row items-center justify-center gap-8 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-white p-4 rounded-xl shadow-2xl">
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
          
          <div className="text-center md:text-left space-y-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ticket ID</p>
              <p className="text-xl font-mono font-bold tracking-widest">{ticket.unique_code}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ticket Holder</p>
              <p className="text-lg font-bold">{/* Could pass user name, but buyer email is generally used if no full name attached to ticket */} You</p>
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Valid for Entry
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
