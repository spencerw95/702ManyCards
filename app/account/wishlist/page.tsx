"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface InventoryItem {
  id: string;
  cardName: string;
  slug: string;
  imageUrl?: string;
  price: number;
  setCode: string;
  condition: string;
}

export default function AccountWishlistPage() {
  const [wishlistSlugs, setWishlistSlugs] = useState<string[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/customer/wishlist").then((r) => r.json()),
      fetch("/api/inventory").then((r) => r.json()),
    ])
      .then(([wishData, invData]) => {
        if (wishData.success) setWishlistSlugs(wishData.wishlist);
        if (Array.isArray(invData)) setInventory(invData);
        else if (invData.items) setInventory(invData.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const removeFromWishlist = async (slug: string) => {
    const res = await fetch(`/api/customer/wishlist?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      setWishlistSlugs(data.wishlist);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 skeleton rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-[var(--radius-lg)] skeleton" />
          ))}
        </div>
      </div>
    );
  }

  // Match wishlist slugs to inventory items
  const wishlistItems = wishlistSlugs
    .map((slug) => inventory.find((item) => item.slug === slug))
    .filter(Boolean) as InventoryItem[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">My Wishlist</h1>

      {wishlistSlugs.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-[var(--color-text-muted)]">Your wishlist is empty.</p>
          <Link href="/search" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
            Browse cards
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlistSlugs.map((slug) => {
            const item = inventory.find((i) => i.slug === slug);
            return (
              <div
                key={slug}
                className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden card-hover"
              >
                <Link href={`/cards/${slug}`} className="block">
                  <div className="aspect-[3/4] bg-[var(--color-bg-secondary)] relative">
                    {item?.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.cardName}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)] text-xs p-2 text-center">
                        {item?.cardName || slug}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/cards/${slug}`}>
                    <h3 className="text-sm font-medium text-[var(--color-text)] line-clamp-2 hover:text-[var(--color-primary)] transition-colors">
                      {item?.cardName || slug}
                    </h3>
                  </Link>
                  {item && (
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {item.setCode} &middot; {item.condition}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {item && (
                      <span className="text-sm font-bold text-[var(--color-primary)]">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => removeFromWishlist(slug)}
                      className="text-xs text-[var(--color-danger)] hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
