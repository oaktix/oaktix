"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ProfilePhotoLightboxProps {
  src: string | null;
  alt: string;
  fallbackIcon?: string;
}

export default function ProfilePhotoLightbox({ src, alt, fallbackIcon }: ProfilePhotoLightboxProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Only render portal after client mount (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape; focus the close button when opened
  useEffect(() => {
    if (!open) return;
    // Focus the close button for keyboard accessibility
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus(); // restore focus to trigger
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 overflow-hidden shadow-md">
      {src ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className="w-full h-full cursor-zoom-in"
            aria-label={`View ${alt} profile photo`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
            />
          </button>

          {/* Lightbox — rendered via portal to escape overflow-hidden/backdrop-filter ancestors */}
          {mounted && open && createPortal(
            <div
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
              onClick={handleClose}
              role="dialog"
              aria-modal="true"
              aria-label={`${alt} profile photo`}
            >
              {/* Close button */}
              <button
                ref={closeRef}
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 z-[101] bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Photo — stopPropagation so clicking image doesn't close */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                />
                <p className="text-white/70 text-sm font-medium">{alt}</p>
              </div>
            </div>,
            document.body
          )}
        </>
      ) : (
        <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center">
          <span className="text-xl">{fallbackIcon ?? "🎯"}</span>
        </div>
      )}
    </div>
  );
}
