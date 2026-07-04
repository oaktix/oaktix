"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Image, Play, ZoomIn, ExternalLink } from "lucide-react";
import type { ProfessionalPortfolio } from "@/lib/professionals/types";

interface ProfessionalPortfolioGalleryProps {
  portfolio: ProfessionalPortfolio[];
}

// ─── Video URL helpers ─────────────────────────────────────────────────────

type VideoPlatform = "youtube" | "tiktok" | "instagram" | "vimeo" | "unknown";

interface VideoInfo {
  platform: VideoPlatform;
  embedUrl: string | null; // null = cannot embed, redirect instead
  /** 16:9 for landscape, 9:16 for portrait (TikTok) */
  aspectRatio: "16/9" | "9/16";
}

function getVideoInfo(url: string): VideoInfo {
  if (!url) return { platform: "unknown", embedUrl: null, aspectRatio: "16/9" };

  // ── YouTube (watch, short URL, Shorts, embed) ──────────────────────────
  const ytMatch =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      aspectRatio: "16/9",
    };
  }

  // ── TikTok ─────────────────────────────────────────────────────────────
  // URL formats: tiktok.com/@user/video/123456  OR  vm.tiktok.com/XXXXX
  const tikMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tikMatch) {
    return {
      platform: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/v2/${tikMatch[1]}`,
      aspectRatio: "9/16",
    };
  }
  if (/tiktok\.com/.test(url)) {
    // Short link or unrecognised format — can't extract ID, redirect instead
    return { platform: "tiktok", embedUrl: null, aspectRatio: "9/16" };
  }

  // ── Instagram ──────────────────────────────────────────────────────────
  // Instagram blocks all iframe embedding (X-Frame-Options: SAMEORIGIN)
  // We always redirect — never try to iframe Instagram
  if (/instagram\.com\/(reel|p)\//.test(url)) {
    return { platform: "instagram", embedUrl: null, aspectRatio: "9/16" };
  }

  // ── Vimeo ──────────────────────────────────────────────────────────────
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      platform: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      aspectRatio: "16/9",
    };
  }

  return { platform: "unknown", embedUrl: null, aspectRatio: "16/9" };
}

const PLATFORM_LABELS: Record<VideoPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  vimeo: "Vimeo",
  unknown: "Video",
};

// ─── Component ────────────────────────────────────────────────────────────

export default function ProfessionalPortfolioGallery({
  portfolio,
}: ProfessionalPortfolioGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (portfolio.length === 0) return null;

  const currentItem = lightboxIndex !== null ? portfolio[lightboxIndex] : null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevItem = () => setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : 0));
  const nextItem = () =>
    setLightboxIndex((i) => (i !== null ? Math.min(portfolio.length - 1, i + 1) : 0));

  return (
    <>
      {/* ── Gallery Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {portfolio.map((item, index) => (
          <button
            key={item.id}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 group hover:ring-2 hover:ring-indigo-500 transition-all"
          >
            {item.media_type === "video" ? (
              <>
                {item.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail_url}
                    alt={item.title ?? "Portfolio video"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/50" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-zinc-900 ml-0.5" />
                  </div>
                </div>
                {/* Platform badge */}
                {item.video_url && (
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white uppercase backdrop-blur-sm">
                      {PLATFORM_LABELS[getVideoInfo(item.video_url).platform]}
                    </span>
                  </div>
                )}
              </>
            ) : item.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.title ?? "Portfolio image"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-8 h-8 text-zinc-400" />
              </div>
            )}

            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-white text-xs font-medium line-clamp-1">{item.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightboxIndex !== null && currentItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {lightboxIndex + 1} / {portfolio.length}
          </div>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevItem(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next */}
          {lightboxIndex < portfolio.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextItem(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* ── Media area ─────────────────────────────────────────── */}
          <div
            className="flex flex-col items-center gap-4 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {currentItem.media_type === "video" && currentItem.video_url ? (
              <VideoEmbed url={currentItem.video_url} />
            ) : currentItem.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentItem.image_url}
                alt={currentItem.title ?? "Portfolio"}
                className="max-h-[80vh] max-w-full rounded-xl object-contain"
              />
            ) : null}

            {(currentItem.title || currentItem.description) && (
              <div className="text-center max-w-lg">
                {currentItem.title && (
                  <h4 className="text-white font-bold text-sm">{currentItem.title}</h4>
                )}
                {currentItem.description && (
                  <p className="text-white/60 text-xs mt-1">{currentItem.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {portfolio.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-sm px-4">
              {portfolio.map((item, i) => (
                <button
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                    i === lightboxIndex
                      ? "ring-2 ring-indigo-400 opacity-100"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  {item.image_url || item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url ?? item.thumbnail_url ?? ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white/50" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── VideoEmbed ───────────────────────────────────────────────────────────
// Renders the correct embed for each platform, with platform-native aspect ratio.
// Instagram cannot be embedded — shows a redirect card instead.

function VideoEmbed({ url }: { url: string }) {
  const info = getVideoInfo(url);

  // ── Platforms that can be embedded ────────────────────────────────────
  if (info.embedUrl) {
    const isPortrait = info.aspectRatio === "9/16";

    return (
      <div
        className={`rounded-xl overflow-hidden bg-black shadow-2xl ${
          isPortrait
            ? // Portrait: cap height, let width follow the 9:16 ratio
              "h-[70vh] aspect-[9/16]"
            : // Landscape: fill available width up to 4xl, 16:9
              "w-full max-w-4xl aspect-video"
        }`}
      >
        <iframe
          src={info.embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          // Needed for TikTok
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  // ── Instagram / unresolvable TikTok short links ────────────────────────
  const label = PLATFORM_LABELS[info.platform];
  const emoji = info.platform === "instagram" ? "📸" : info.platform === "tiktok" ? "🎵" : "▶️";

  return (
    <div className="flex flex-col items-center gap-5 p-8 rounded-2xl bg-zinc-900 border border-zinc-700 max-w-xs text-center">
      <span className="text-5xl">{emoji}</span>
      <div>
        <p className="text-white font-bold text-base mb-1">{label} Video</p>
        <p className="text-white/50 text-xs leading-relaxed">
          {info.platform === "instagram"
            ? "Instagram does not allow videos to be embedded from external sites."
            : "This link format cannot be embedded directly."}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Watch on {label}
      </a>
    </div>
  );
}
