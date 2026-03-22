"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type {
  InventoryItem,
  YugiohCard,
  CartItem,
  PricingRule,
  CONDITION_SHORT as ConditionShortType,
} from "@/lib/types";
import { CONDITION_SHORT } from "@/lib/types";
import { getCardByName, getMarketPrice, getAllMarketPrices, getCardImageUrl } from "@/lib/ygoprodeck";

// ===== Multi-game market price types =====

interface PokemonMarketData {
  name: string;
  set: string;
  number: string;
  rarity: string;
  prices: {
    tcgplayer: { market: number | null; low: number | null; mid: number | null; high: number | null; variant: string } | null;
    allVariants: Record<string, { market: number | null; low: number | null; mid: number | null; high: number | null }>;
    cardmarket: null;
  };
  url: string;
}

interface MTGMarketData {
  name: string;
  set: string;
  setCode: string;
  number: string;
  rarity: string;
  prices: {
    tcgplayer: { usd: string | null; usd_foil: string | null; usd_etched: string | null };
    cardmarket: { eur: string | null; eur_foil: string | null };
  };
  urls: {
    tcgplayer: string;
    cardmarket: string;
    scryfall: string;
  };
}

// ===== Auto-pricing helper =====

function computeAutoPrice(marketPrice: number, rule: PricingRule): number {
  let price = marketPrice;
  if (rule.type === "market_minus_percent") {
    price = marketPrice * (1 - rule.value / 100);
  } else if (rule.type === "market_minus_amount") {
    price = marketPrice - rule.value;
  } else {
    price = rule.value;
  }
  if (rule.minPrice !== undefined && price < rule.minPrice) {
    price = rule.minPrice;
  }
  return Math.max(0, price);
}

function getAutoPriceLabel(rule: PricingRule): string {
  if (rule.type === "market_minus_percent") return `${rule.value}% below market`;
  if (rule.type === "market_minus_amount") return `$${rule.value.toFixed(2)} below market`;
  return "Fixed price";
}
import { addToCart } from "@/lib/cart";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";
import { addRecentlyViewed } from "@/lib/recently-viewed";

// ===== Card ID Map =====

const CARD_IDS: Record<string, number> = {
  "Dark Magician": 46986414,
  "Blue-Eyes White Dragon": 89631139,
  "Exodia the Forbidden One": 33396948,
  "Left Leg of the Forbidden One": 44519536,
  "Right Leg of the Forbidden One": 8124921,
  "Left Arm of the Forbidden One": 7902349,
  "Right Arm of the Forbidden One": 70903634,
  "Gate Guardian": 25833572,
  "Jinzo": 77585513,
  "Monster Reborn": 83764718,
  "Change of Heart": 4031928,
  "Yata-Garasu": 3078576,
  "Chaos Emperor Dragon - Envoy of the End": 82301904,
  "Black Luster Soldier - Envoy of the Beginning": 72989439,
  "Red-Eyes Black Dragon": 74677422,
  "Summoned Skull": 70781052,
  "Mechanicalchaser": 7359741,
  "Pot of Greed": 55144522,
  "Dark Magician Girl": 38033121,
  "Raigeki": 12580477,
  "Mirror Force": 44095762,
  "Accesscode Talker": 86066372,
  "Rainbow Dragon": 95744531,
  "Hitotsu-Me Giant": 76184692,
  "Fissure": 66788016,
  "Effect Veiler": 97268402,
  "Mystical Space Typhoon": 5318639,
  "Torrential Tribute": 53582587,
};

function getCardId(name: string): number {
  return CARD_IDS[name] || 46986414;
}

// ===== Props =====

interface CardDetailClientProps {
  item: InventoryItem;
  relatedItems: InventoryItem[];
}

// ===== Component =====

export default function CardDetailClient({ item, relatedItems }: CardDetailClientProps) {
  const [cardData, setCardData] = useState<YugiohCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [stockEmail, setStockEmail] = useState("");
  const [stockSubmitted, setStockSubmitted] = useState(false);
  const [pokemonData, setPokemonData] = useState<PokemonMarketData | null>(null);
  const [mtgData, setMtgData] = useState<MTGMarketData | null>(null);
  const [multiGameLoading, setMultiGameLoading] = useState(false);

  const isYugioh = item.game === "yugioh";
  const isPokemon = item.game === "pokemon";
  const isMTG = item.game === "mtg";
  const cardId = isYugioh ? getCardId(item.cardName) : 0;
  const fallbackImage = item.imageUrl
    ? item.imageUrl
    : isYugioh
    ? `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`
    : "/placeholder-card.png";

  // Fetch YGOPRODeck data — only for Yu-Gi-Oh cards
  useEffect(() => {
    if (!isYugioh) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCardByName(item.cardName)
      .then((data) => setCardData(data))
      .finally(() => setLoading(false));
  }, [item.cardName, isYugioh]);

  // Fetch Pokemon / MTG market data
  useEffect(() => {
    if (isPokemon) {
      setMultiGameLoading(true);
      const params = new URLSearchParams({ name: item.cardName });
      // setCode is card number (e.g. "4/102"), not set ID — skip it for API lookup
      fetch(`/api/card-data/pokemon?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setPokemonData(data))
        .catch(() => setPokemonData(null))
        .finally(() => setMultiGameLoading(false));
    } else if (isMTG) {
      setMultiGameLoading(true);
      const params = new URLSearchParams({ name: item.cardName });
      if (item.setCode) params.set("set", item.setCode.toLowerCase());
      fetch(`/api/card-data/mtg?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setMtgData(data))
        .catch(() => setMtgData(null))
        .finally(() => setMultiGameLoading(false));
    }
  }, [item.cardName, item.setCode, isPokemon, isMTG]);

  // Track wishlist state
  useEffect(() => {
    setWishlisted(isInWishlist(item.cardName));
  }, [item.cardName]);

  // Track recently viewed
  useEffect(() => {
    const lowestPrice = relatedItems.length
      ? Math.min(...relatedItems.map((i) => i.price))
      : item.price;
    addRecentlyViewed({
      cardName: item.cardName,
      slug: item.slug,
      imageUrl: cardData?.card_images?.[0]?.image_url || fallbackImage,
      lowestPrice,
    });
  }, [item.cardName, item.slug, item.price, relatedItems, cardData, fallbackImage]);

  // Derived values — prefer item.imageUrl for Pokemon/MTG, use API data for YGO
  const imageUrl = item.imageUrl
    ? item.imageUrl
    : cardData?.card_images?.[0]?.image_url || fallbackImage;
  const tcgMarketPrice = cardData ? getMarketPrice(cardData) : 0;
  const allPrices = cardData ? getAllMarketPrices(cardData) : {};
  const isMonster = cardData
    ? cardData.type?.toLowerCase().includes("monster")
    : false;
  const totalQuantity = relatedItems.reduce((sum, i) => sum + i.quantity, 0);
  const isSoldOut = totalQuantity === 0;

  // Unified market price across all games (for savings calculation)
  const unifiedMarketPrice: number = (() => {
    if (isYugioh) return tcgMarketPrice;
    if (isPokemon && pokemonData?.prices?.tcgplayer?.market) return pokemonData.prices.tcgplayer.market;
    if (isMTG && mtgData?.prices?.tcgplayer?.usd) return parseFloat(mtgData.prices.tcgplayer.usd);
    return 0;
  })();

  // Handlers
  const handleToggleWishlist = useCallback(() => {
    const nowWished = toggleWishlist({
      cardName: item.cardName,
      imageUrl,
      slug: item.slug,
    });
    setWishlisted(nowWished);
  }, [item.cardName, item.slug, imageUrl]);

  const handleAddToCart = useCallback(
    (listing: InventoryItem) => {
      const cartItem: CartItem = {
        inventoryId: listing.id,
        cardName: listing.cardName,
        setCode: listing.setCode,
        condition: listing.condition,
        edition: listing.edition,
        price: listing.price,
        quantity: 1,
        maxQuantity: listing.quantity,
        imageUrl,
        slug: listing.slug,
      };
      addToCart(cartItem);
      setAddedMap((prev) => ({ ...prev, [listing.id]: true }));
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [listing.id]: false }));
      }, 2000);
    },
    [imageUrl]
  );

  const handleStockAlert = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!stockEmail) return;
      // In production this would call an API
      console.log("Stock alert registered:", { email: stockEmail, card: item.cardName });
      setStockSubmitted(true);
    },
    [stockEmail, item.cardName]
  );

  function calcSavings(ourPrice: number): number | null {
    const mp = unifiedMarketPrice;
    if (!mp || mp <= 0) return null;
    if (ourPrice >= mp) return null;
    return Math.round(((mp - ourPrice) / mp) * 100);
  }

  // Compute auto-priced display price for a listing
  function getDisplayPrice(listing: InventoryItem): { price: number; isAuto: boolean; label?: string } {
    if (listing.pricingRule && unifiedMarketPrice > 0) {
      const autoPrice = computeAutoPrice(unifiedMarketPrice, listing.pricingRule);
      return { price: autoPrice, isAuto: true, label: getAutoPriceLabel(listing.pricingRule) };
    }
    return { price: listing.price, isAuto: false };
  }

  // ===== Render =====

  return (
    <div style={styles.page}>
      {/* Breadcrumb */}
      <nav style={styles.breadcrumb}>
        <Link href="/" style={styles.breadcrumbLink}>
          Home
        </Link>
        <span style={styles.breadcrumbSep}>/</span>
        <Link href="/search" style={styles.breadcrumbLink}>
          Cards
        </Link>
        <span style={styles.breadcrumbSep}>/</span>
        <span style={styles.breadcrumbCurrent}>{item.cardName}</span>
      </nav>

      {/* Main Layout */}
      <div style={styles.mainGrid} data-cd-grid>
        {/* Left Column: Image + Wishlist */}
        <div style={styles.leftCol} data-cd-left>
          <div style={styles.imageWrapper} data-cd-image>
            <img
              src={imageUrl}
              alt={item.cardName}
              style={styles.cardImage}
              loading="eager"
            />
          </div>
          <button
            onClick={handleToggleWishlist}
            style={{
              ...styles.wishlistBtn,
              ...(wishlisted ? styles.wishlistBtnActive : {}),
            }}
          >
            {wishlisted ? "\u2665 In Wishlist" : "\u2661 Add to Wishlist"}
          </button>
        </div>

        {/* Right Column: Details */}
        <div style={styles.rightCol}>
          {/* Card Name */}
          <h1 style={styles.cardName} data-cd-card-name>{item.cardName}</h1>

          {/* Set info row */}
          <div style={styles.metaRow}>
            <span style={styles.setInfo}>
              {item.setName} &middot; {item.setCode}
            </span>
          </div>

          {/* Badges */}
          <div style={styles.badgeRow}>
            <span style={styles.rarityBadge}>{item.rarity}</span>
            <span style={styles.editionBadge}>{item.edition}</span>
            {isSoldOut && <span style={styles.soldBadge}>SOLD</span>}
          </div>

          {/* Monster Stats */}
          {isMonster && cardData && (
            <div style={styles.statsGrid} data-cd-stats-grid>
              {cardData.atk !== undefined && (
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>ATK</span>
                  <span style={styles.statValue}>{cardData.atk}</span>
                </div>
              )}
              {cardData.def !== undefined && (
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>DEF</span>
                  <span style={styles.statValue}>{cardData.def}</span>
                </div>
              )}
              {cardData.level !== undefined && (
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>
                    {cardData.type?.includes("Xyz") ? "Rank" : "Level"}
                  </span>
                  <span style={styles.statValue}>{cardData.level}</span>
                </div>
              )}
              {cardData.attribute && (
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Attribute</span>
                  <span style={styles.statValue}>{cardData.attribute}</span>
                </div>
              )}
              {cardData.race && (
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Type</span>
                  <span style={styles.statValue}>{cardData.race}</span>
                </div>
              )}
              {cardData.type && (
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Card Type</span>
                  <span style={styles.statValue}>{cardData.type}</span>
                </div>
              )}
            </div>
          )}

          {/* Effect / Flavor Text */}
          {cardData?.desc && (
            <div style={styles.descSection}>
              <h3 style={styles.sectionTitle}>
                {isMonster ? "Card Effect" : "Card Text"}
              </h3>
              <p style={styles.descText}>{cardData.desc}</p>
            </div>
          )}

          {loading && !cardData && isYugioh && (
            <p style={styles.loadingText}>Loading card details...</p>
          )}

          {/* TCGPlayer Market Price Reference — unified for all games */}
          {isYugioh && tcgMarketPrice > 0 && (
            <a
              href={`https://www.tcgplayer.com/search/yugioh/product?productLineName=yugioh&q=${encodeURIComponent(item.cardName)}&view=grid`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.marketRef, textDecoration: "none", cursor: "pointer" }}
              title="View on TCGPlayer"
            >
              <span style={styles.marketRefLabel}>
                TCGPlayer Market Price
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </span>
              <span style={styles.marketRefValue}>
                ${tcgMarketPrice.toFixed(2)}
              </span>
            </a>
          )}

          {/* Pokemon Market Price */}
          {isPokemon && pokemonData?.prices?.tcgplayer && (
            <a
              href={pokemonData.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.marketRef, textDecoration: "none", cursor: "pointer" }}
              title="View on TCGPlayer"
            >
              <span style={styles.marketRefLabel}>
                TCGPlayer Market Price
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </span>
              <span style={styles.marketRefValue}>
                {pokemonData.prices.tcgplayer.market
                  ? `$${pokemonData.prices.tcgplayer.market.toFixed(2)}`
                  : "N/A"}
                {pokemonData.prices.tcgplayer.variant && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6 }}>
                    ({pokemonData.prices.tcgplayer.variant})
                  </span>
                )}
              </span>
            </a>
          )}

          {/* MTG Market Price */}
          {isMTG && mtgData?.prices?.tcgplayer?.usd && (
            <a
              href={mtgData.urls.tcgplayer}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.marketRef, textDecoration: "none", cursor: "pointer" }}
              title="View on TCGPlayer"
            >
              <span style={styles.marketRefLabel}>
                TCGPlayer Market Price
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </span>
              <span style={styles.marketRefValue}>
                ${parseFloat(mtgData.prices.tcgplayer.usd).toFixed(2)}
              </span>
            </a>
          )}

          {/* Loading indicator for Pokemon / MTG */}
          {(isPokemon || isMTG) && multiGameLoading && (
            <p style={styles.loadingText}>Loading market prices...</p>
          )}

          {/* Divider */}
          <hr style={styles.divider} />

          {/* Available Listings */}
          <div style={styles.listingsSection}>
            <h2 style={styles.sectionTitle}>Available Listings</h2>

            {!isSoldOut ? (
              <div style={styles.listingsTable}>
                {/* Header */}
                <div style={styles.listingHeader} data-cd-listing-header>
                  <span style={styles.listingHeaderCell}>Condition</span>
                  <span style={styles.listingHeaderCell}>Price</span>
                  <span style={styles.listingHeaderCell} data-cd-listing-qty>Qty</span>
                  <span style={styles.listingHeaderCell} data-cd-listing-savings></span>
                  <span style={styles.listingHeaderCell}></span>
                </div>

                {relatedItems.map((listing) => {
                  const dp = getDisplayPrice(listing);
                  const savings = calcSavings(dp.price);
                  const outOfStock = listing.quantity === 0;

                  return (
                    <div
                      key={listing.id}
                      style={{
                        ...styles.listingRow,
                        ...(outOfStock ? styles.listingRowDisabled : {}),
                      }}
                      data-cd-listing-row
                    >
                      <span style={styles.listingCondition}>
                        <span style={styles.conditionFull} data-cd-condition-full>
                          {listing.condition}
                        </span>
                        <span style={styles.conditionShort} data-cd-condition-short>
                          {CONDITION_SHORT[listing.condition]}
                        </span>
                        {listing.edition !== item.edition && (
                          <span style={styles.editionTag}>
                            {listing.edition}
                          </span>
                        )}
                      </span>

                      <span style={styles.listingPrice}>
                        ${dp.price.toFixed(2)}
                        {dp.isAuto && dp.label && (
                          <span style={styles.autoPriceTag}>
                            {dp.label}
                          </span>
                        )}
                      </span>

                      <span style={styles.listingQty} data-cd-listing-qty>
                        {outOfStock ? (
                          <span style={styles.outOfStockText}>Sold Out</span>
                        ) : (
                          `${listing.quantity} avail.`
                        )}
                      </span>

                      <span style={styles.listingSavings} data-cd-listing-savings>
                        {savings !== null && savings > 0 && (
                          <span style={styles.savingsBadge}>
                            Save {savings}%
                          </span>
                        )}
                      </span>

                      <span style={styles.listingAction}>
                        {!outOfStock && (
                          <button
                            onClick={() => handleAddToCart(listing)}
                            style={{
                              ...styles.addToCartBtn,
                              ...(addedMap[listing.id]
                                ? styles.addToCartBtnAdded
                                : {}),
                            }}
                            disabled={addedMap[listing.id]}
                          >
                            {addedMap[listing.id]
                              ? "\u2713 Added"
                              : "Add to Cart"}
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Sold Out State */
              <div style={styles.soldOutSection}>
                <div style={styles.soldOutIcon}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <h3 style={styles.soldOutTitle}>Currently Sold Out</h3>
                <p style={styles.soldOutDesc}>
                  Get notified when this card is back in stock.
                </p>
                {!stockSubmitted ? (
                  <form onSubmit={handleStockAlert} style={styles.stockForm}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={stockEmail}
                      onChange={(e) => setStockEmail(e.target.value)}
                      required
                      style={styles.stockInput}
                    />
                    <button type="submit" style={styles.stockBtn}>
                      Notify Me
                    </button>
                  </form>
                ) : (
                  <p style={styles.stockSuccess}>
                    We will email you when this card is restocked.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Below-Fold Sections */}
      <div style={styles.belowFold}>
        {/* Our Printings In Stock */}
        {(() => {
          // Group relatedItems by set code to show unique printings we have
          const printingMap = new Map<string, { setCode: string; setName: string; rarity: string; edition: string; lowestPrice: number; totalQty: number; conditions: string[] }>();
          relatedItems.forEach((ri) => {
            const key = `${ri.setCode}-${ri.edition}`;
            const existing = printingMap.get(key);
            if (!existing) {
              printingMap.set(key, {
                setCode: ri.setCode,
                setName: ri.setName,
                rarity: ri.rarity,
                edition: ri.edition,
                lowestPrice: ri.price,
                totalQty: ri.quantity,
                conditions: [CONDITION_SHORT[ri.condition]],
              });
            } else {
              existing.totalQty += ri.quantity;
              existing.lowestPrice = Math.min(existing.lowestPrice, ri.price);
              if (!existing.conditions.includes(CONDITION_SHORT[ri.condition])) {
                existing.conditions.push(CONDITION_SHORT[ri.condition]);
              }
            }
          });
          const printings = Array.from(printingMap.values());

          if (printings.length <= 1) return null;

          return (
            <section style={styles.fullWidthSection}>
              <h2 style={styles.sectionTitle}>Our Printings In Stock</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Set Name</th>
                      <th style={styles.th}>Set Code</th>
                      <th style={styles.th}>Rarity</th>
                      <th style={styles.th}>Edition</th>
                      <th style={styles.th}>Conditions</th>
                      <th style={{ ...styles.th, textAlign: "right" as const }}>From</th>
                      <th style={{ ...styles.th, textAlign: "right" as const }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printings.map((p, idx) => (
                      <tr
                        key={`${p.setCode}-${p.edition}-${idx}`}
                        style={{
                          ...(idx % 2 === 0 ? styles.trEven : styles.trOdd),
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          // Scroll to the listing section and highlight
                          const el = document.getElementById("available-listings");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="hover:bg-[var(--color-primary)]/5"
                      >
                        <td style={styles.td}>{p.setName}</td>
                        <td style={styles.tdCode}>{p.setCode}</td>
                        <td style={styles.td}>{p.rarity}</td>
                        <td style={styles.td}>{p.edition}</td>
                        <td style={styles.td}>{p.conditions.join(", ")}</td>
                        <td style={{ ...styles.td, textAlign: "right" as const, fontWeight: 600 }}>
                          ${p.lowestPrice.toFixed(2)}
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" as const }}>
                          {p.totalQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}

        {/* Market Prices Comparison — unified for all games */}
        {(() => {
          const externalLinkIcon = (
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          );

          // Build price cards based on game
          type PriceEntry = { label: string; price: number; url: string; suffix?: string };
          const entries: PriceEntry[] = [];

          if (isYugioh && Object.keys(allPrices).length > 0) {
            entries.push(
              { label: "TCGPlayer", price: allPrices.tcgplayer || 0, url: `https://www.tcgplayer.com/search/yugioh/product?productLineName=yugioh&q=${encodeURIComponent(item.cardName)}&view=grid` },
              { label: "Cardmarket", price: allPrices.cardmarket || 0, url: `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodeURIComponent(item.cardName)}` },
              { label: "eBay", price: allPrices.ebay || 0, url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item.cardName + " yugioh")}&_sacat=0` },
              { label: "Amazon", price: allPrices.amazon || 0, url: `https://www.amazon.com/s?k=${encodeURIComponent(item.cardName + " yugioh card")}` },
            );
          }

          if (isPokemon && pokemonData) {
            const variants = pokemonData.prices?.allVariants || {};
            const tcgMain = pokemonData.prices?.tcgplayer;
            if (tcgMain?.market) {
              entries.push({ label: "TCGPlayer", price: tcgMain.market, url: pokemonData.url });
            }
            // Show individual variants
            for (const [variant, vData] of Object.entries(variants)) {
              if (vData.market && variant !== pokemonData.prices?.tcgplayer?.variant) {
                const variantLabel = variant.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                entries.push({
                  label: variantLabel,
                  price: vData.market,
                  url: pokemonData.url,
                  suffix: variant === "holofoil" ? "Holo" : variant === "reverseHolofoil" ? "Rev. Holo" : undefined,
                });
              }
            }
          }

          if (isMTG && mtgData) {
            const usd = mtgData.prices?.tcgplayer?.usd ? parseFloat(mtgData.prices.tcgplayer.usd) : 0;
            const usdFoil = mtgData.prices?.tcgplayer?.usd_foil ? parseFloat(mtgData.prices.tcgplayer.usd_foil) : 0;
            const eur = mtgData.prices?.cardmarket?.eur ? parseFloat(mtgData.prices.cardmarket.eur) : 0;

            if (usd > 0) entries.push({ label: "TCGPlayer", price: usd, url: mtgData.urls.tcgplayer });
            if (usdFoil > 0) entries.push({ label: "TCGPlayer (Foil)", price: usdFoil, url: mtgData.urls.tcgplayer });
            if (eur > 0) entries.push({ label: "Cardmarket", price: eur, url: mtgData.urls.cardmarket, suffix: "EUR" });
            // Always add Scryfall link
            entries.push({ label: "Scryfall", price: 0, url: mtgData.urls.scryfall });
          }

          if (entries.length === 0) return null;

          const lowestOurPrice = relatedItems.length > 0
            ? Math.min(...relatedItems.map((r) => getDisplayPrice(r).price))
            : item.price;

          return (
            <section style={styles.fullWidthSection}>
              <h2 style={styles.sectionTitle}>Market Prices</h2>
              <div style={styles.priceGrid} data-cd-price-grid>
                {entries.map(({ label, price, url, suffix }) => {
                  const isCheaper = price > 0 && lowestOurPrice < price;
                  return (
                    <a
                      key={`${label}-${suffix || ""}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...styles.priceCard,
                        textDecoration: "none",
                        cursor: "pointer",
                        borderColor: isCheaper ? "var(--color-success)" : "var(--color-border)",
                      }}
                      title={`View on ${label}`}
                      data-cd-price-card
                    >
                      <span style={styles.priceCardLabel}>
                        {label}
                        {suffix && <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.7 }}>({suffix})</span>}
                        {externalLinkIcon}
                      </span>
                      <span style={styles.priceCardValue} data-cd-price-value>
                        {price > 0 ? `${suffix === "EUR" ? "\u20AC" : "$"}${price.toFixed(2)}` : "View"}
                      </span>
                      {isCheaper && (
                        <span style={styles.priceCardSavings}>
                          Our price: ${lowestOurPrice.toFixed(2)}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })()}
      </div>
    </div>
  );
}

// ===== Inline Styles =====

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 16px 64px",
  },

  // Breadcrumb
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
    fontSize: 14,
  },
  breadcrumbLink: {
    color: "var(--color-text-muted)",
    textDecoration: "none",
  },
  breadcrumbSep: {
    color: "var(--color-text-muted)",
  },
  breadcrumbCurrent: {
    color: "var(--color-text)",
    fontWeight: 500,
  },

  // Main Grid — responsive via CSS below
  mainGrid: {
    display: "grid",
    gap: 40,
    alignItems: "start",
  },

  // Left Column — position handled by responsive CSS
  leftCol: {},
  imageWrapper: {
    background: "var(--color-bg-card)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
    padding: 16,
    display: "flex",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    maxWidth: 400,
    height: "auto",
    borderRadius: 8,
    display: "block",
  },
  wishlistBtn: {
    width: "100%",
    marginTop: 12,
    padding: "12px 16px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg-card)",
    color: "var(--color-text-secondary)",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  wishlistBtnActive: {
    background: "var(--color-danger)",
    color: "#fff",
    borderColor: "var(--color-danger)",
  },

  // Right Column
  rightCol: {
    minWidth: 0,
  },
  cardName: {
    fontSize: 28,
    fontWeight: 700,
    color: "var(--color-text)",
    margin: 0,
    lineHeight: 1.2,
  },
  metaRow: {
    marginTop: 8,
  },
  setInfo: {
    fontSize: 15,
    color: "var(--color-text-secondary)",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 12,
  },
  rarityBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 600,
    background: "var(--color-accent)",
    color: "#fff",
  },
  editionBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 500,
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-secondary)",
    border: "1px solid var(--color-border)",
  },
  soldBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 700,
    background: "var(--color-danger)",
    color: "#fff",
    letterSpacing: 1,
  },

  // Stats Grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 20,
    padding: 16,
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
  },
  statItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--color-text)",
  },

  // Description
  descSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--color-text)",
    margin: "0 0 12px",
  },
  descText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "var(--color-text-secondary)",
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  loadingText: {
    fontSize: 14,
    color: "var(--color-text-muted)",
    marginTop: 16,
  },

  // Market Ref
  marketRef: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    padding: "12px 16px",
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
  },
  marketRefLabel: {
    fontSize: 14,
    color: "var(--color-text-muted)",
  },
  marketRefValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
  },

  // Divider
  divider: {
    border: "none",
    borderTop: "1px solid var(--color-border)",
    margin: "24px 0",
  },

  // Listings Section
  listingsSection: {
    marginTop: 0,
  },
  listingsTable: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
  },
  listingHeader: {
    display: "grid",
    gap: 12,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    borderBottom: "1px solid var(--color-border)",
  },
  listingHeaderCell: {},
  listingRow: {
    display: "grid",
    gap: 12,
    padding: "14px 16px",
    alignItems: "center",
    borderBottom: "1px solid var(--color-border)",
    transition: "background 0.15s",
  },
  listingRowDisabled: {
    opacity: 0.5,
  },
  listingCondition: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 15,
    fontWeight: 500,
    color: "var(--color-text)",
  },
  conditionFull: {},
  conditionShort: {
    display: "none",
  },
  editionTag: {
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 4,
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border)",
  },
  listingPrice: {
    fontSize: 17,
    fontWeight: 700,
    color: "var(--color-text)",
  },
  listingQty: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
  },
  outOfStockText: {
    color: "var(--color-danger)",
    fontWeight: 500,
  },
  listingSavings: {},
  savingsBadge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    background: "var(--color-success)",
    color: "#fff",
  },
  listingAction: {},
  addToCartBtn: {
    padding: "8px 16px",
    borderRadius: "var(--radius)",
    border: "none",
    background: "var(--color-primary)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap" as const,
  },
  addToCartBtnAdded: {
    background: "var(--color-success)",
    cursor: "default",
  },

  // Sold Out
  soldOutSection: {
    textAlign: "center" as const,
    padding: "40px 20px",
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
  },
  soldOutIcon: {
    color: "var(--color-text-muted)",
    marginBottom: 12,
  },
  soldOutTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "var(--color-text)",
    margin: "0 0 8px",
  },
  soldOutDesc: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    margin: "0 0 20px",
  },
  stockForm: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    maxWidth: 400,
    margin: "0 auto",
  },
  stockInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: 14,
    outline: "none",
  },
  stockBtn: {
    padding: "10px 20px",
    borderRadius: "var(--radius)",
    border: "none",
    background: "var(--color-primary)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  stockSuccess: {
    fontSize: 14,
    color: "var(--color-success)",
    fontWeight: 500,
  },

  // Below Fold
  belowFold: {
    marginTop: 48,
    display: "flex",
    flexDirection: "column" as const,
    gap: 40,
  },
  fullWidthSection: {},

  // All Printings Table
  tableWrapper: {
    overflowX: "auto" as const,
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    borderBottom: "2px solid var(--color-border)",
    background: "var(--color-bg-secondary)",
  },
  td: {
    padding: "10px 16px",
    color: "var(--color-text-secondary)",
    borderBottom: "1px solid var(--color-border)",
  },
  tdCode: {
    padding: "10px 16px",
    color: "var(--color-text-muted)",
    fontFamily: "monospace",
    fontSize: 13,
    borderBottom: "1px solid var(--color-border)",
  },
  trEven: {
    background: "var(--color-bg-card)",
  },
  trOdd: {
    background: "var(--color-bg)",
  },

  // Market Prices Grid — responsive via CSS below
  priceGrid: {
    display: "grid",
    gap: 16,
  },
  priceCard: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 6,
    padding: "20px 16px",
    background: "var(--color-bg-card)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
  },
  priceCardLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-muted)",
  },
  priceCardValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--color-text)",
  },
  priceCardSavings: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-success)",
    marginTop: 2,
  },

  // Auto-pricing tag
  autoPriceTag: {
    display: "block",
    fontSize: 11,
    fontWeight: 500,
    color: "var(--color-primary)",
    marginTop: 2,
  },
};

// ===== Responsive Styles via CSS-in-JS =====

const responsiveCSS = `
  /* Desktop defaults */
  [data-cd-grid] {
    grid-template-columns: 2fr 3fr;
  }
  [data-cd-left] {
    position: sticky;
    top: 100px;
  }
  [data-cd-listing-header],
  [data-cd-listing-row] {
    grid-template-columns: 2fr 1fr 1fr 1fr 140px;
  }
  [data-cd-price-grid] {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Tablet */
  @media (max-width: 1024px) {
    [data-cd-price-grid] {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Mobile */
  @media (max-width: 768px) {
    [data-cd-grid] {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    [data-cd-left] {
      position: static;
    }
    [data-cd-image] {
      max-width: 280px;
      margin: 0 auto;
    }
    [data-cd-listing-header],
    [data-cd-listing-row] {
      grid-template-columns: 1.5fr 1fr 1fr 100px;
    }
    [data-cd-listing-savings] {
      display: none;
    }
    [data-cd-condition-full] {
      display: none;
    }
    [data-cd-condition-short] {
      display: inline !important;
    }
    [data-cd-card-name] {
      font-size: 24px;
    }
    [data-cd-stats-grid] {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Small mobile */
  @media (max-width: 480px) {
    [data-cd-listing-header],
    [data-cd-listing-row] {
      grid-template-columns: 1fr 1fr 80px;
      gap: 8px;
      padding: 10px 12px;
    }
    [data-cd-listing-qty] {
      display: none;
    }
    [data-cd-price-grid] {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    [data-cd-price-card] {
      padding: 14px 10px;
    }
    [data-cd-price-value] {
      font-size: 18px;
    }
  }
`;

// Inject responsive styles via a style tag at top of component
if (typeof document !== "undefined") {
  const id = "card-detail-responsive";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = responsiveCSS;
    document.head.appendChild(style);
  }
}
