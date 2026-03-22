import Link from "next/link";
import Image from "next/image";
import { getAllItems, getUniqueCards } from "@/lib/inventory";
import type { InventoryItem, TCGGame } from "@/lib/types";
import RarityCardWrapper from "@/components/RarityCardWrapper";

// ===== Image helpers (mirrors app/page.tsx pattern) =====

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

function getCardId(cardName: string): number {
  return CARD_IDS[cardName] || 46986414;
}

function getImageUrl(item: { cardName: string; imageUrl?: string }): string {
  if (item.imageUrl) return item.imageUrl;
  return `https://images.ygoprodeck.com/images/cards_small/${getCardId(item.cardName)}.jpg`;
}

// ===== Slug helper =====

function toSlug(cardName: string): string {
  return cardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ===== Related cards logic =====

interface RelatedCardsProps {
  cardName: string;
  setName: string;
  rarity: string;
  game: TCGGame;
  currentSlug: string;
}

async function getRelatedCards(
  cardName: string,
  setName: string,
  rarity: string,
  game: TCGGame,
  currentSlug: string,
): Promise<InventoryItem[]> {
  const allItems = await getAllItems();

  // Deduplicate by card name so we show distinct cards, not duplicate listings
  const uniqueCards = getUniqueCards(allItems);

  // Exclude the current card
  const candidates = uniqueCards.filter(
    (item) => toSlug(item.cardName) !== currentSlug,
  );

  // Score each candidate for relevance
  const currentPrice =
    uniqueCards.find((c) => toSlug(c.cardName) === currentSlug)?.price ?? 0;

  const scored = candidates.map((item) => {
    let score = 0;

    // Same game is the strongest signal
    if (item.game === game) score += 100;

    // Same set is very relevant
    if (item.setName === setName) score += 50;

    // Same rarity
    if (item.rarity === rarity) score += 20;

    // Similar price range (within 50% of current card price)
    if (currentPrice > 0) {
      const ratio =
        Math.min(item.price, currentPrice) /
        Math.max(item.price, currentPrice);
      if (ratio > 0.5) score += 10;
    }

    return { item, score };
  });

  // Sort by score descending, then shuffle items with the same score for variety
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Deterministic tiebreak by name so it's stable across renders
    return a.item.cardName.localeCompare(b.item.cardName);
  });

  return scored.slice(0, 8).map((s) => s.item);
}

// ===== Rarity badge colors =====

function rarityColor(rarity: string): string {
  const r = rarity.toLowerCase();
  if (r.includes("secret") || r.includes("starlight") || r.includes("ghost"))
    return "bg-yellow-500/15 text-yellow-400";
  if (r.includes("ultra") || r.includes("hyper") || r.includes("mythic"))
    return "bg-purple-500/15 text-purple-400";
  if (r.includes("super") || r.includes("illustration") || r.includes("rare holo"))
    return "bg-blue-500/15 text-blue-400";
  if (r.includes("rare"))
    return "bg-cyan-500/15 text-cyan-400";
  if (r.includes("uncommon"))
    return "bg-green-500/15 text-green-400";
  return "bg-gray-500/15 text-gray-400";
}

// ===== Component =====

export default async function RelatedCards({
  cardName,
  setName,
  rarity,
  game,
  currentSlug,
}: RelatedCardsProps) {
  const related = await getRelatedCards(cardName, setName, rarity, game, currentSlug);

  if (related.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">You May Also Like</h2>
        <Link
          href="/search"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Horizontal scrollable row */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[var(--color-border)] scrollbar-track-transparent -mx-1 px-1">
        {related.map((item) => {
          const slug = toSlug(item.cardName);
          return (
            <Link
              key={item.id}
              href={`/cards/${slug}`}
              className="group flex-shrink-0 w-[180px] sm:w-[200px] p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover"
            >
              {/* Card image */}
              <RarityCardWrapper rarity={item.rarity} className="mb-2 rounded">
                <div className="aspect-[421/614] relative rounded overflow-hidden bg-[var(--color-bg-secondary)]">
                  <Image
                    src={getImageUrl(item)}
                    alt={item.cardName}
                    fill
                    className="object-contain"
                    sizes="200px"
                    unoptimized
                  />
                </div>
              </RarityCardWrapper>

              {/* Card name */}
              <h3 className="font-medium text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                {item.cardName}
              </h3>

              {/* Rarity badge */}
              <span
                className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${rarityColor(item.rarity)}`}
              >
                {item.rarity}
              </span>

              {/* Price */}
              <p className="font-bold text-sm mt-1.5">
                ${item.price.toFixed(2)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
