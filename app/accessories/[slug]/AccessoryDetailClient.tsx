"use client";

import { useState } from "react";
import Link from "next/link";
import type { AccessoryItem } from "@/lib/types";
import { ACCESSORY_CATEGORY_LABELS } from "@/lib/types";
import { addToCart } from "@/lib/cart";

// ===== Gradient backgrounds per category =====
function categoryGradient(category: string): string {
  switch (category) {
    case "playmat": return "bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900";
    case "deck-box": return "bg-gradient-to-br from-sky-900 via-blue-800 to-cyan-900";
    case "card-sleeves": return "bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900";
    case "booster-box": return "bg-gradient-to-br from-orange-900 via-orange-800 to-red-900";
    case "starter-deck": return "bg-gradient-to-br from-yellow-900 via-amber-800 to-amber-900";
    case "tin-bundle": return "bg-gradient-to-br from-pink-900 via-rose-800 to-rose-900";
    default: return "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800";
  }
}

function categoryBadgeClass(category: string): string {
  switch (category) {
    case "playmat": return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "deck-box": return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    case "card-sleeves": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "booster-box": return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    case "starter-deck": return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "tin-bundle": return "bg-pink-500/20 text-pink-300 border-pink-500/40";
    default: return "bg-gray-500/20 text-gray-300 border-gray-500/40";
  }
}

const GAME_LABELS: Record<string, string> = {
  yugioh: "Yu-Gi-Oh!",
  pokemon: "Pokemon",
  mtg: "Magic: The Gathering",
  multi: "All Games",
};

interface Props {
  item: AccessoryItem;
  relatedItems: AccessoryItem[];
}

export default function AccessoryDetailClient({ item, relatedItems }: Props) {
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart({
      inventoryId: item.id,
      cardName: item.name,
      setCode: item.brand || "Accessory",
      condition: "Near Mint",
      edition: "Unlimited",
      price: item.price,
      quantity,
      maxQuantity: item.quantity,
      imageUrl: item.imageUrl || "",
      slug: item.slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link href="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">Home</Link>
        <span className="text-[var(--color-text-muted)]">/</span>
        <Link href="/accessories" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">Products</Link>
        <span className="text-[var(--color-text-muted)]">/</span>
        <span className="text-[var(--color-text)] font-medium truncate">{item.name}</span>
      </nav>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left — Product Image */}
        <div>
          <div className={`relative aspect-square rounded-2xl overflow-hidden ${categoryGradient(item.category)}`}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-contain p-6"
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
                <svg className="w-24 h-24 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                {item.brand && (
                  <span className="text-lg font-bold uppercase tracking-widest opacity-60">{item.brand}</span>
                )}
              </div>
            )}

            {/* Badges */}
            <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded-full border ${categoryBadgeClass(item.category)}`}>
              {ACCESSORY_CATEGORY_LABELS[item.category] || item.category}
            </span>
          </div>
        </div>

        {/* Right — Details */}
        <div>
          {/* Brand */}
          {item.brand && (
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
              {item.brand}
            </p>
          )}

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3 leading-tight">
            {item.name}
          </h1>

          {/* Set name + Game */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {item.setName && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                {item.setName}
              </span>
            )}
            {item.game && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                {GAME_LABELS[item.game] || item.game}
              </span>
            )}
            {item.subcategory && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                {item.subcategory === "japanese-size" ? "Japanese Size" : "Standard Size"}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-[var(--color-text)]">
              ${item.price.toFixed(2)}
            </span>
            <span className={`text-sm font-medium ${item.quantity > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
              {item.quantity > 0 ? `${item.quantity} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Description</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Specs */}
          <div className="mb-6 border-t border-[var(--color-border)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Details</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">Category</dt>
              <dd className="text-[var(--color-text)]">{ACCESSORY_CATEGORY_LABELS[item.category] || item.category}</dd>

              {item.brand && (
                <>
                  <dt className="text-[var(--color-text-muted)]">Brand</dt>
                  <dd className="text-[var(--color-text)]">{item.brand}</dd>
                </>
              )}

              {item.color && (
                <>
                  <dt className="text-[var(--color-text-muted)]">Color</dt>
                  <dd className="text-[var(--color-text)]">{item.color}</dd>
                </>
              )}

              {item.game && (
                <>
                  <dt className="text-[var(--color-text-muted)]">Game</dt>
                  <dd className="text-[var(--color-text)]">{GAME_LABELS[item.game] || item.game}</dd>
                </>
              )}

              {item.setName && (
                <>
                  <dt className="text-[var(--color-text-muted)]">Set</dt>
                  <dd className="text-[var(--color-text)]">{item.setName}</dd>
                </>
              )}

              {item.subcategory && (
                <>
                  <dt className="text-[var(--color-text-muted)]">Size</dt>
                  <dd className="text-[var(--color-text)]">{item.subcategory === "japanese-size" ? "Japanese (59mm x 86mm)" : "Standard (66mm x 91mm)"}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Quantity + Add to Cart */}
          {item.quantity > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-2.5 text-sm font-medium text-[var(--color-text)] border-x border-[var(--color-border)] min-w-[48px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(item.quantity, quantity + 1))}
                  className="px-3 py-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={added}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all ${
                  added
                    ? "bg-[var(--color-success)] text-white"
                    : "bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-[0.98]"
                }`}
              >
                {added ? "✓ Added to Cart!" : `Add to Cart — $${(item.price * quantity).toFixed(2)}`}
              </button>
            </div>
          ) : (
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
              <p className="text-[var(--color-danger)] font-semibold mb-1">Currently Out of Stock</p>
              <p className="text-xs text-[var(--color-text-muted)]">Check back soon or contact us for availability</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedItems.length > 0 && (
        <section className="mt-16 pt-8 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text)]">You May Also Like</h2>
            <Link href="/accessories" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedItems.map((related) => (
              <Link
                key={related.id}
                href={`/accessories/${related.slug}`}
                className="group block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden hover:border-[var(--color-primary)] hover:shadow-lg transition-all"
              >
                <div className={`relative aspect-[4/3] overflow-hidden ${categoryGradient(related.category)}`}>
                  {related.imageUrl ? (
                    <img src={related.imageUrl} alt={related.name} className="absolute inset-0 w-full h-full object-contain p-3" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/60">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {related.name}
                  </h3>
                  <p className="text-sm font-bold text-[var(--color-primary)] mt-1">${related.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
