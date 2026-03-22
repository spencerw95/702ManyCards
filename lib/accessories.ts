import type { AccessoryItem, AccessoryCategory } from "./types";
import { getServiceSupabase } from "./supabase";

// JSON fallback import
let accessoriesData: AccessoryItem[] = [];
try {
  accessoriesData = require("@/data/accessories.json") as AccessoryItem[];
} catch {
  // JSON file may not exist; that's fine — Supabase is primary
}

// ===== Supabase row -> AccessoryItem mapper =====

function mapRow(row: Record<string, unknown>): AccessoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    category: row.category as AccessoryCategory,
    subcategory: (row.subcategory as string) || undefined,
    price: Number(row.price) || 0,
    cost: row.cost != null ? Number(row.cost) : undefined,
    quantity: Number(row.quantity) || 0,
    imageUrl: (row.image_url as string) || undefined,
    images: (row.images as string[]) || undefined,
    brand: (row.brand as string) || undefined,
    color: (row.color as string) || undefined,
    game: (row.game as AccessoryItem["game"]) || undefined,
    setName: (row.set_name as string) || undefined,
    dateAdded: row.date_added as string,
    slug: row.slug as string,
  };
}

/**
 * Get all accessory items from Supabase. Falls back to JSON on failure.
 */
export async function getAllAccessories(): Promise<AccessoryItem[]> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("accessories")
      .select("*")
      .order("date_added", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) {
      if (accessoriesData.length > 0) return accessoriesData;
      return [];
    }
    return data.map(mapRow);
  } catch (e) {
    console.error("[accessories] Supabase fetch failed, using JSON fallback:", e);
    return accessoriesData;
  }
}

/**
 * Search and filter accessory items.
 */
export async function searchAccessories(
  query?: string,
  category?: AccessoryCategory | null,
  subcategory?: string | null
): Promise<AccessoryItem[]> {
  let items = await getAllAccessories();

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
export async function getAccessoryBySlug(slug: string): Promise<AccessoryItem | undefined> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("accessories")
      .select("*")
      .eq("slug", slug)
      .limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      return mapRow(data[0]);
    }
  } catch (e) {
    console.error("[accessories] getAccessoryBySlug Supabase failed:", e);
  }
  // Fallback
  return accessoriesData.find((item) => item.slug === slug);
}

/**
 * Get unique brands from accessories (for potential future filter use).
 */
export async function getUniqueBrands(): Promise<string[]> {
  const items = await getAllAccessories();
  const brands = new Set(
    items
      .map((item) => item.brand)
      .filter(Boolean) as string[]
  );
  return Array.from(brands).sort();
}
