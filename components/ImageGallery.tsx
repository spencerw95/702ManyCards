"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

export default function ImageGallery({ images, alt = "Product" }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const total = images.length;
  const isSingle = total <= 1;

  // Clamp index if images array changes
  useEffect(() => {
    if (currentIndex >= total) setCurrentIndex(Math.max(0, total - 1));
  }, [total, currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0) setCurrentIndex(total - 1);
      else if (index >= total) setCurrentIndex(0);
      else setCurrentIndex(index);
    },
    [total]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (isSingle) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape" && lightboxOpen) {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSingle, goPrev, goNext, lightboxOpen]);

  // Close lightbox on Escape even for single images
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);

  if (total === 0) {
    return (
      <div className="aspect-square rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center">
        <svg className="w-16 h-16 text-[var(--color-text-muted)] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
        </svg>
      </div>
    );
  }

  const currentImage = images[currentIndex] || images[0];

  return (
    <>
      <div className="flex flex-col lg:flex-row-reverse gap-3">
        {/* Main image area */}
        <div className="flex-1 relative" ref={mainRef}>
          <div
            className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] cursor-zoom-in group"
            onClick={() => setLightboxOpen(true)}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <div className="aspect-square flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage}
                alt={`${alt} ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out"
                style={{ transform: isZoomed ? "scale(1.15)" : "scale(1)" }}
                draggable={false}
              />
            </div>

            {/* Counter badge */}
            {!isSingle && (
              <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-black/60 text-white backdrop-blur-sm">
                {currentIndex + 1} / {total}
              </span>
            )}

            {/* Arrow buttons for mobile / convenience */}
            {!isSingle && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thumbnails — horizontal on mobile, vertical on desktop */}
        {!isSingle && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[500px] lg:w-20 pb-1 lg:pb-0 scrollbar-thin">
            {images.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 lg:w-full lg:h-20 rounded-lg border-2 overflow-hidden transition-all ${
                  idx === currentIndex
                    ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${alt} thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain bg-[var(--color-bg-secondary)] p-1"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          {!isSingle && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 text-white backdrop-blur-sm">
              {currentIndex + 1} / {total}
            </span>
          )}

          {/* Navigation arrows */}
          {!isSingle && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Previous image"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Next image"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Fullscreen image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={`${alt} fullscreen ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
