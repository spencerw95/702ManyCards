// Server-side inventory operations via Supabase
// Used by API routes for persistent data

import { getServiceSupabase } from "./supabase";

// ===== Types =====

export interface SupabaseInventoryItem {
  id: string;
  card_name: string;
  set_name: string;
  set_code: string;
  rarity: string;
  condition: string;
  edition: string;
  price: number;
  cost: number;
  quantity: number;
  game: string;
  image_url: string | null;
  slug: string;
  date_added: string;
}

// ===== Read operations =====

export async function getInventoryItems(game?: string) {
  const sb = getServiceSupabase();
  let query = sb.from("inventory").select("*").order("date_added", { ascending: false });
  if (game) query = query.eq("game", game);
  const { data, error } = await query;
  if (error) throw error;
  return data as SupabaseInventoryItem[];
}

export async function getInventoryItemById(id: string) {
  const sb = getServiceSupabase();
  const { data, error } = await sb.from("inventory").select("*").eq("id", id).single();
  if (error) return null;
  return data as SupabaseInventoryItem;
}

export async function getInventoryBySlug(slug: string) {
  const sb = getServiceSupabase();
  const { data, error } = await sb.from("inventory").select("*").eq("slug", slug);
  if (error) return [];
  return data as SupabaseInventoryItem[];
}

export async function getInventoryByCardName(cardName: string) {
  const sb = getServiceSupabase();
  const { data, error } = await sb.from("inventory").select("*").eq("card_name", cardName);
  if (error) return [];
  return data as SupabaseInventoryItem[];
}

export async function searchInventory(query: string, game?: string) {
  const sb = getServiceSupabase();
  let dbQuery = sb.from("inventory").select("*");

  if (query) {
    dbQuery = dbQuery.or(
      `card_name.ilike.%${query}%,set_code.ilike.%${query}%,set_name.ilike.%${query}%,rarity.ilike.%${query}%`
    );
  }
  if (game) dbQuery = dbQuery.eq("game", game);

  const { data, error } = await dbQuery.order("card_name");
  if (error) throw error;
  return data as SupabaseInventoryItem[];
}

// ===== Write operations =====

export async function addInventoryItem(item: Omit<SupabaseInventoryItem, "date_added">) {
  const sb = getServiceSupabase();
  const { data, error } = await sb.from("inventory").insert(item).select().single();
  if (error) throw error;
  return data as SupabaseInventoryItem;
}

export async function updateInventoryItem(id: string, updates: Partial<SupabaseInventoryItem>) {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("inventory")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as SupabaseInventoryItem;
}

export async function deleteInventoryItem(id: string) {
  const sb = getServiceSupabase();
  const { error } = await sb.from("inventory").delete().eq("id", id);
  if (error) throw error;
}

// ===== Inventory auto-deduction =====

export async function deductInventory(items: { id: string; quantity: number }[]): Promise<{ success: boolean; errors: string[] }> {
  const sb = getServiceSupabase();
  const errors: string[] = [];

  for (const item of items) {
    // Use a transaction-like approach: read, check, update
    const { data: current, error: readError } = await sb
      .from("inventory")
      .select("id, card_name, quantity")
      .eq("id", item.id)
      .single();

    if (readError || !current) {
      errors.push(`Item ${item.id} not found`);
      continue;
    }

    if (current.quantity < item.quantity) {
      errors.push(`${current.card_name}: only ${current.quantity} available, requested ${item.quantity}`);
      continue;
    }

    const newQty = current.quantity - item.quantity;
    const { error: updateError } = await sb
      .from("inventory")
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (updateError) {
      errors.push(`Failed to update ${current.card_name}: ${updateError.message}`);
    }
  }

  return { success: errors.length === 0, errors };
}

// ===== Stats =====

export async function getInventoryStats() {
  const sb = getServiceSupabase();

  const { data: items } = await sb.from("inventory").select("card_name, quantity, set_name, game");

  if (!items) return { totalListings: 0, uniqueCards: 0, totalSets: 0, totalQuantity: 0, byGame: {} };

  const uniqueCards = new Set(items.map(i => i.card_name)).size;
  const totalSets = new Set(items.map(i => i.set_name)).size;
  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const byGame: Record<string, number> = {};
  items.forEach(i => {
    byGame[i.game] = (byGame[i.game] || 0) + 1;
  });

  return {
    totalListings: items.length,
    uniqueCards,
    totalSets,
    totalQuantity,
    byGame,
  };
}
