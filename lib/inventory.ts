import type { InventoryItem, SearchFilters, SortOption, CardCondition, TCGGame } from "./types";
import { CONDITION_ORDER } from "./types";
import inventoryData from "@/data/inventory.json";

const RARITY_ORDER: Record<string, number> = {
  "Starlight Rare": 20,
  "Ghost Rare": 19,
  "Collector's Rare": 18,
  "Prismatic Secret Rare": 17,
  "Quarter Century Secret Rare": 16,
  "Ultimate Rare": 15,
  "Secret Rare": 14,
  "Ultra Rare": 13,
  "Super Rare": 12,
  "Rare": 10,
  "Short Print": 8,
  "Starfoil Rare": 7,
  "Shatterfoil Rare": 7,
  "Mosaic Rare": 7,
  "Gold Rare": 11,
  "Gold Secret Rare": 12,
  "Platinum Rare": 11,
  "Premium Gold Rare": 11,
  "Parallel Rare": 9,
  "Duel Terminal Normal Parallel Rare": 6,
  "Duel Terminal Rare Parallel Rare": 7,
  "Duel Terminal Super Parallel Rare": 8,
  "Duel Terminal Ultra Parallel Rare": 9,
  "Common": 1,
};

/**
 * All known Yu-Gi-Oh rarities for filter display.
 * This is the master list — inventory may only contain a subset.
 */
export const ALL_YUGIOH_RARITIES: string[] = [
  "Starlight Rare",
  "Ghost Rare",
  "Collector's Rare",
  "Prismatic Secret Rare",
  "Quarter Century Secret Rare",
  "Ultimate Rare",
  "Secret Rare",
  "Ultra Rare",
  "Gold Secret Rare",
  "Gold Rare",
  "Platinum Rare",
  "Premium Gold Rare",
  "Super Rare",
  "Rare",
  "Short Print",
  "Starfoil Rare",
  "Shatterfoil Rare",
  "Mosaic Rare",
  "Parallel Rare",
  "Common",
];

/**
 * All known Pokemon TCG rarities for filter display.
 */
export const ALL_POKEMON_RARITIES: string[] = [
  "Hyper Rare",
  "Special Illustration Rare",
  "Illustration Rare",
  "Ultra Rare",
  "Double Rare",
  "Shiny Ultra Rare",
  "ACE SPEC Rare",
  "Shiny Rare",
  "Rare Holo",
  "Rare Holo GX",
  "Rare Holo EX",
  "Rare Holo V",
  "Rare Holo VMAX",
  "Rare Ultra",
  "Rare",
  "Promo",
  "Uncommon",
  "Common",
];

/**
 * All known Magic: The Gathering rarities for filter display.
 */
export const ALL_MTG_RARITIES: string[] = [
  "Mythic Rare",
  "Rare",
  "Uncommon",
  "Common",
  "Special",
  "Bonus",
];

/**
 * Get the rarity list for a specific game.
 */
export function getRaritiesForGame(game: TCGGame): string[] {
  switch (game) {
    case "yugioh":
      return ALL_YUGIOH_RARITIES;
    case "pokemon":
      return ALL_POKEMON_RARITIES;
    case "mtg":
      return ALL_MTG_RARITIES;
    default:
      return ALL_YUGIOH_RARITIES;
  }
}

/**
 * Get all inventory items.
 */
export function getAllItems(): InventoryItem[] {
  return inventoryData as InventoryItem[];
}

/**
 * Search and filter inventory items.
 */
export function searchItems(filters: Partial<SearchFilters>): InventoryItem[] {
  let items = getAllItems();

  // Game filter
  if (filters.game) {
    items = items.filter((item) => item.game === filters.game);
  }

  // Text search
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    items = items.filter(
      (item) =>
        item.cardName.toLowerCase().includes(q) ||
        item.setCode.toLowerCase().includes(q) ||
        item.setName.toLowerCase().includes(q)
    );
  }

  // Set name filter
  if (filters.setName && filters.setName !== "") {
    items = items.filter((item) => item.setName === filters.setName);
  }

  // Rarity filter
  if (filters.rarity && filters.rarity.length > 0) {
    items = items.filter((item) => filters.rarity!.includes(item.rarity));
  }

  // Card type filter (requires YGOPRODeck data, so we skip here — handled at component level)

  // Condition filter
  if (filters.condition && filters.condition.length > 0) {
    items = items.filter((item) => filters.condition!.includes(item.condition));
  }

  // Edition filter
  if (filters.edition && filters.edition.length > 0) {
    items = items.filter((item) => filters.edition!.includes(item.edition));
  }

  // Price range
  if (filters.priceMin !== undefined && filters.priceMin !== null) {
    items = items.filter((item) => item.price >= filters.priceMin!);
  }
  if (filters.priceMax !== undefined && filters.priceMax !== null) {
    items = items.filter((item) => item.price <= filters.priceMax!);
  }

  return items;
}

/**
 * Get all listings for a specific card name.
 */
export function getItemsByCardName(cardName: string): InventoryItem[] {
  return getAllItems()
    .filter((item) => item.cardName.toLowerCase() === cardName.toLowerCase())
    .sort((a, b) => {
      const condA = CONDITION_ORDER.indexOf(a.condition as CardCondition);
      const condB = CONDITION_ORDER.indexOf(b.condition as CardCondition);
      return condA - condB;
    });
}

/**
 * Get a single item by its slug.
 */
export function getItemBySlug(slug: string): InventoryItem | undefined {
  return getAllItems().find((item) => item.slug === slug);
}

/**
 * Get unique card entries (deduplicated by card name only) for grid display.
 * Returns one entry per card name with the lowest price and total quantity across all printings.
 */
export function getUniqueCards(items: InventoryItem[]): InventoryItem[] {
  const cardMap = new Map<string, InventoryItem & { totalQuantity: number; listingCount: number }>();
  for (const item of items) {
    const key = item.cardName;
    const existing = cardMap.get(key);
    if (!existing) {
      cardMap.set(key, { ...item, totalQuantity: item.quantity, listingCount: 1 });
    } else {
      existing.totalQuantity += item.quantity;
      existing.listingCount += 1;
      // Keep the lowest-priced listing as the representative
      if (item.price < existing.price) {
        const totalQty = existing.totalQuantity;
        const count = existing.listingCount;
        Object.assign(existing, item, { totalQuantity: totalQty, listingCount: count });
      }
    }
  }
  return Array.from(cardMap.values());
}

/**
 * Get the total number of listings for a specific card name.
 */
export function getListingCountForCard(cardName: string): number {
  return getAllItems().filter((item) => item.cardName === cardName).length;
}

/**
 * Get price range for a card name (min and max across all listings).
 */
export function getPriceRangeForCard(cardName: string): { min: number; max: number } {
  const items = getAllItems().filter((item) => item.cardName === cardName);
  if (items.length === 0) return { min: 0, max: 0 };
  const prices = items.map((i) => i.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * Get items added in the last N days.
 */
export function getNewArrivals(days: number = 7): InventoryItem[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return getAllItems().filter((item) => new Date(item.dateAdded) >= cutoff);
}

/**
 * Sort inventory items.
 */
export function sortItems(items: InventoryItem[], sortBy: SortOption): InventoryItem[] {
  const sorted = [...items];

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name-asc":
      return sorted.sort((a, b) => a.cardName.localeCompare(b.cardName));
    case "name-desc":
      return sorted.sort((a, b) => b.cardName.localeCompare(a.cardName));
    case "newest":
      return sorted.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    case "rarity":
      return sorted.sort((a, b) => {
        const rarA = RARITY_ORDER[a.rarity] || 0;
        const rarB = RARITY_ORDER[b.rarity] || 0;
        return rarB - rarA;
      });
    default:
      return sorted;
  }
}

/**
 * Get unique set names from inventory.
 */
export function getUniqueSetNames(): string[] {
  const sets = new Set(getAllItems().map((item) => item.setName));
  return Array.from(sets).sort();
}

/**
 * Get unique set names filtered by game.
 */
export function getSetNamesForGame(game: TCGGame): string[] {
  const sets = new Set(
    getAllItems()
      .filter((item) => item.game === game)
      .map((item) => item.setName)
  );
  return Array.from(sets).sort();
}

/**
 * Get unique rarities from inventory.
 */
export function getUniqueRarities(): string[] {
  const rarities = new Set(getAllItems().map((item) => item.rarity));
  return Array.from(rarities).sort(
    (a, b) => (RARITY_ORDER[b] || 0) - (RARITY_ORDER[a] || 0)
  );
}

/**
 * Get total card count and total unique cards.
 */
export function getInventoryStats(): { totalListings: number; uniqueCards: number; totalSets: number } {
  const items = getAllItems();
  const uniqueNames = new Set(items.map((i) => i.cardName));
  const uniqueSets = new Set(items.map((i) => i.setName));
  return {
    totalListings: items.reduce((sum, i) => sum + i.quantity, 0),
    uniqueCards: uniqueNames.size,
    totalSets: uniqueSets.size,
  };
}
