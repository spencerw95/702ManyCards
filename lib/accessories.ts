import type { AccessoryItem, AccessoryCategory } from "./types";
import accessoriesData from "@/data/accessories.json";

/**
 * Get all accessory items.
 */
export function getAllAccessories(): AccessoryItem[] {
  return accessoriesData as AccessoryItem[];
}

/**
 * Search and filter accessory items.
 */
export function searchAccessories(
  query?: string,
  category?: AccessoryCategory | null,
  subcategory?: string | null
): AccessoryItem[] {
  let items = getAllAccessories();

  // Category filter
  if (category) {
    items = items.filter((item) => item.category === category);
  }

  // Subcategory filter (e.g., "japanese-size" or "standard-size" for sleeves)
  if (subcategory) {
    items = items.filter((item) => item.subcategory === subcategory);
  }

  // Text search
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
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
}

/**
 * Get a single accessory by its slug.
 */
export function getAccessoryBySlug(slug: string): AccessoryItem | undefined {
  return getAllAccessories().find((item) => item.slug === slug);
}

/**
 * Get unique brands from accessories (for potential future filter use).
 */
export function getUniqueBrands(): string[] {
  const brands = new Set(
    getAllAccessories()
      .map((item) => item.brand)
      .filter(Boolean) as string[]
  );
  return Array.from(brands).sort();
}
