"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getRecentlyViewed, clearRecentlyViewed } from "@/lib/recently-viewed";
import type { RecentlyViewedCard } from "@/lib/types";

export default function RecentlyViewed() {
  const [cards, setCards] = useState<RecentlyViewedCard[]>([]);

  useEffect(() => {
    setCards(getRecentlyViewed(10));
  }, []);

  if (cards.length === 0) return null;

  function handleClear() {
    clearRecentlyViewed();
    setCards([]);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Recently Viewed</h2>
        <button
          onClick={handleClear}
          className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Clear History
        </button>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[var(--color-border)] scrollbar-track-transparent">
          {cards.map((card) => (
            <Link
              key={card.slug}
              href={`/cards/${card.slug}`}
              className="group flex-shrink-0 w-36 sm:w-40 block p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover"
            >
              <div className="aspect-[421/614] relative mb-2 rounded overflow-hidden bg-[var(--color-bg-secondary)]">
                <Image
                  src={card.imageUrl}
                  alt={card.cardName}
                  fill
                  className="object-contain"
                  sizes="160px"
                  unoptimized
                />
              </div>
              <h3 className="font-medium text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                {card.cardName}
              </h3>
              <p className="font-bold text-sm mt-1">
                ${card.lowestPrice.toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
