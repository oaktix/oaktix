"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  slug: string;
}

export default function ShareButton({ slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Dynamically build target public event url
    const url = `${window.location.origin}/events/${slug}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join us at this event!",
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn("Share failed, falling back to clipboard copy", err);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (copyErr) {
        console.error("Clipboard copy failed too", copyErr);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`px-4 py-2.5 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer select-none w-full ${
        copied
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-white/5 border-white/10 hover:border-indigo-500/30 hover:bg-indigo-600/10 text-zinc-300 hover:text-indigo-400"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" /> Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" /> Share
        </>
      )}
    </button>
  );
}
