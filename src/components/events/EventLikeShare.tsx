"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, X, Copy, Check, Download, Send, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";

interface EventLikeShareProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  initialLiked: boolean;
  user: { id: string } | null;
}

export default function EventLikeShare({
  eventId,
  eventTitle,
  eventSlug,
  initialLiked,
  user,
}: EventLikeShareProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isNativeShareSupported, setIsNativeShareSupported] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Generate full URL
    const url = `${window.location.origin}/events/${eventSlug}`;
    setShareUrl(url);

    // Check if native sharing is supported
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setIsNativeShareSupported(true);
    }

    // Generate QR Code URL
    QRCode.toDataURL(
      url,
      {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      },
      (err, generatedUrl) => {
        if (!err) {
          setQrCodeUrl(generatedUrl);
        } else {
          console.error("Failed to generate QR Code:", err);
        }
      }
    );
  }, [eventSlug]);

  const handleLike = async () => {
    if (!user) {
      // Redirect to login with message
      router.push(`/login?message=${encodeURIComponent("Please log in to save events to your dashboard.")}`);
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    // Optimistic Update
    const originalLiked = liked;
    setLiked(!originalLiked);

    try {
      if (originalLiked) {
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_events")
          .insert({
            user_id: user.id,
            event_id: eventId,
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error("Error toggling saved status:", err);
      // Revert optimistic update on error
      setLiked(originalLiked);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: eventTitle,
        text: `Check out ${eventTitle} on OakTix!`,
        url: shareUrl,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error using native share:", err);
      }
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${eventSlug}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Heart/Like Button */}
        <button
          onClick={handleLike}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center active:scale-95 duration-200 ${
            liked
              ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20"
              : "bg-zinc-900/80 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white"
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-transform ${
              liked ? "fill-rose-500 scale-110 duration-300" : ""
            }`}
          />
        </button>

        {/* Share Button */}
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Share event"
          className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 hover:text-white transition-all text-zinc-400 cursor-pointer flex items-center justify-center active:scale-95 duration-200"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Share Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          <div className="relative bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl text-center z-10 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800/60 text-zinc-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close share dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Share Event</span>
              <h2 className="text-xl font-bold font-heading text-white mt-1 line-clamp-1">{eventTitle}</h2>
              <p className="text-zinc-500 text-xs mt-1">Scan the QR code or copy the event link to share.</p>
            </div>

            {/* QR Code Container */}
            <div className="mb-6">
              {qrCodeUrl ? (
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-2xl shadow-lg w-48 h-48 mx-auto flex items-center justify-center border border-zinc-800/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrCodeUrl} 
                      alt={`QR code for ${eventTitle}`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download QR Code
                  </button>
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-zinc-900/40 rounded-2xl animate-pulse flex items-center justify-center border border-zinc-850">
                  <span className="text-zinc-650 text-xs">Generating QR...</span>
                </div>
              )}
            </div>

            {/* Copy Link Input Field */}
            <div className="flex gap-2 bg-zinc-900/60 border border-zinc-850 rounded-xl p-1.5 pl-3 mb-6 items-center">
              <span className="text-xs text-zinc-500 select-none font-medium truncate flex-1 text-left">
                {shareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </>
                )}
              </button>
            </div>

            {/* Social Share Badges & Native Share */}
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-4">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${eventTitle} - ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 flex items-center justify-center transition-all"
                  aria-label="Share on WhatsApp"
                >
                  <Send className="w-5 h-5 rotate-45 -translate-x-0.5" />
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${eventTitle} on OakTix!`)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white flex items-center justify-center transition-all"
                  aria-label="Share on Twitter / X"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 flex items-center justify-center transition-all"
                  aria-label="Share on Facebook"
                >
                  <span className="font-bold text-lg leading-none -translate-y-0.5">f</span>
                </a>
              </div>

              {isNativeShareSupported && (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-400" /> Share via Device...
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
