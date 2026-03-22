"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { AccessoryItem, AccessoryCategory } from "@/lib/types";
import { ACCESSORY_CATEGORY_LABELS, ACCESSORY_GAME_LABELS } from "@/lib/types";
// Client-side filtering (searchAccessories is now async/server-only)
import { addToCart } from "@/lib/cart";

type TabValue = "all" | AccessoryCategory;

const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "playmat", label: "Playmats" },
  { value: "deck-box", label: "Deck Boxes" },
  { value: "card-sleeves", label: "Card Sleeves" },
  { value: "booster-box", label: "Booster Boxes" },
  { value: "starter-deck", label: "Starter Decks" },
  { value: "tin-bundle", label: "Tins & Bundles" },
];

const SLEEVE_SUBCATEGORIES: { value: string | null; label: string }[] = [
  { value: null, label: "All Sizes" },
  { value: "japanese-size", label: "Japanese Size" },
  { value: "standard-size", label: "Standard Size" },
];

// ===== Category gradient backgrounds =====

function categoryGradient(category: AccessoryCategory): string {
  switch (category) {
    case "playmat":
      return "bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900";
    case "deck-box":
      return "bg-gradient-to-br from-sky-900 via-blue-800 to-cyan-900";
    case "card-sleeves":
      return "bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900";
    case "booster-box":
      return "bg-gradient-to-br from-orange-900 via-orange-800 to-red-900";
    case "starter-deck":
      return "bg-gradient-to-br from-yellow-900 via-amber-800 to-amber-900";
    case "tin-bundle":
      return "bg-gradient-to-br from-pink-900 via-rose-800 to-rose-900";
    case "other":
      return "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800";
  }
}

// ===== Category icon SVGs =====

function CategoryIcon({ category }: { category: AccessoryCategory }) {
  switch (category) {
    case "playmat":
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
        </svg>
      );
    case "deck-box":
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case "card-sleeves":
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      );
    case "booster-box":
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case "starter-deck":
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L12 17.25 6.429 14.25m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25" />
        </svg>
      );
    case "tin-bundle":
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      );
    case "other":
      return (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      );
  }
}

// ===== Category badge color =====

function categoryBadgeClass(category: AccessoryCategory): string {
  switch (category) {
    case "playmat":
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "deck-box":
      return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    case "card-sleeves":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "booster-box":
      return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    case "starter-deck":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "tin-bundle":
      return "bg-pink-500/20 text-pink-300 border-pink-500/40";
    case "other":
      return "bg-gray-500/20 text-gray-300 border-gray-500/40";
  }
}

interface Props {
  initialItems: AccessoryItem[];
}

export default function AccessoriesPageClient({ initialItems }: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [sleeveSubcategory, setSleeveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  // selectedItem state removed — using full product pages now

  // Filter items based on current state
  const filteredItems = useMemo(() => {
    const category = activeTab === "all" ? null : activeTab;
    const sub = activeTab === "card-sleeves" ? sleeveSubcategory : null;
    // Client-side filtering on server-provided initialItems
    let items = [...initialItems];

    // Category filter
    if (category) {
      items = items.filter((item) => item.category === (category as AccessoryCategory));
    }

    // Subcategory filter
    if (sub) {
      items = items.filter((item) => item.subcategory === sub);
    }

    // Text search
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          (item.color && item.color.toLowerCase().includes(q)) ||
          (item.setName && item.setName.toLowerCase().includes(q)) ||
          (item.game && item.game.toLowerCase().includes(q))
      );
    }

    return items;
  }, [activeTab, sleeveSubcategory, searchQuery, initialItems]);

  const handleAddToCart = (item: AccessoryItem) => {
    addToCart({
      inventoryId: item.id,
      cardName: item.name,
      setCode: item.brand || "Accessory",
      condition: "Near Mint",
      edition: "Unlimited",
      price: item.price,
      quantity: 1,
      maxQuantity: item.quantity,
      imageUrl: item.imageUrl || "",
      slug: item.slug,
    });
    setAddedMap((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              if (tab.value !== "card-sleeves") {
                setSleeveSubcategory(null);
              }
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeTab === tab.value
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sleeve sub-filter */}
      {activeTab === "card-sleeves" && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SLEEVE_SUBCATEGORIES.map((sub) => (
            <button
              key={sub.value ?? "all"}
              onClick={() => setSleeveSubcategory(sub.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                sleeveSubcategory === sub.value
                  ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} found
      </p>

      {/* Product grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-[var(--color-text-muted)] font-medium">No products found</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-primary)] hover:shadow-lg transition-all"
            >
              {/* Product image area — links to detail page */}
              <Link href={`/accessories/${item.slug}`} className={`block relative aspect-[4/3] overflow-hidden ${categoryGradient(item.category)}`}>
                {/* If there is an actual image, show it */}
                {item.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  /* Styled product visual */
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white/90">
                    <div className="w-12 h-12 mb-2 opacity-60">
                      <CategoryIcon category={item.category} />
                    </div>
                    {item.brand && (
                      <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">
                        {item.brand}
                      </span>
                    )}
                  </div>
                )}

                {/* Category badge */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${categoryBadgeClass(item.category)}`}>
                  {ACCESSORY_CATEGORY_LABELS[item.category]}
                </span>

                {/* Game badge for sealed products */}
                {item.game && item.game !== "multi" && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full border bg-white/15 text-white border-white/30">
                    {ACCESSORY_GAME_LABELS[item.game]}
                  </span>
                )}

                {/* Subcategory badge for sleeves (when no game badge) */}
                {item.subcategory && !item.game && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40">
                    {item.subcategory === "japanese-size" ? "Japanese" : "Standard"}
                  </span>
                )}
              </Link>

              {/* Card body */}
              <Link href={`/accessories/${item.slug}`} className="block p-4">
                {/* Brand */}
                {item.brand && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    {item.brand}
                  </p>
                )}

                {/* Name */}
                <h3 className="font-semibold text-sm text-[var(--color-text)] leading-snug mb-1 line-clamp-2">
                  {item.name}
                </h3>

                {/* Set name for sealed products */}
                {item.setName && (
                  <p className="text-[10px] text-[var(--color-primary)] font-medium mb-1">{item.setName}</p>
                )}

                {/* Description */}
                <p className="text-xs text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                  {item.description}
                </p>

                {/* Color */}
                {item.color && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-2">
                    Color: {item.color}
                  </p>
                )}

                {/* Price + Stock row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className={`text-xs font-medium ${item.quantity > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                    {item.quantity > 0 ? `${item.quantity} in stock` : "Out of stock"}
                  </span>
                </div>
              </Link>

                {/* Add to Cart button */}
                <div className="px-4 pb-4">
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={item.quantity === 0 || addedMap[item.id]}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    addedMap[item.id]
                      ? "bg-[var(--color-success)] text-white cursor-default"
                      : item.quantity === 0
                      ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] cursor-not-allowed"
                      : "bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-[0.98]"
                  }`}
                >
                  {addedMap[item.id] ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Added!
                    </span>
                  ) : item.quantity === 0 ? (
                    "Out of Stock"
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-5.98.286h11.356M15.75 14.25a3 3 0 01-5.98.286m0 0L7.5 14.25m0 0l1.256-4.706a.75.75 0 01.724-.544h7.77a.75.75 0 01.724.544l1.256 4.706" />
                      </svg>
                      Add to Cart
                    </span>
                  )}
                </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
