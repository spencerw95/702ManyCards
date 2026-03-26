import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { InventoryItem, CardCondition, CardEdition, TCGGame } from "@/lib/types";
import { CONDITION_SHORT } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getServiceSupabase } from "@/lib/supabase";

function mapRow(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    cardName: row.card_name as string,
    setName: row.set_name as string,
    setCode: row.set_code as string,
    rarity: row.rarity as string,
    condition: (row.condition as CardCondition) || "Near Mint",
    edition: (row.edition as InventoryItem["edition"]) || "Unlimited",
    price: Number(row.price) || 0,
    cost: row.cost != null ? Number(row.cost) : undefined,
    quantity: Number(row.quantity) || 0,
    game: (row.game as TCGGame) || "yugioh",
    slug: row.slug as string,
    dateAdded: row.date_added as string,
    language: "English",
    imageUrl: (row.image_url as string) || undefined,
    images: (row.images as string[]) || undefined,
    pricingRule: (row.pricing_rule as InventoryItem["pricingRule"]) || undefined,
  };
}

function generateId(
  setCode: string,
  condition: CardCondition,
  edition: CardEdition
): string {
  const condShort = CONDITION_SHORT[condition] || "UNK";
  const edShort = edition === "1st Edition" ? "1st" : edition === "Unlimited" ? "Unl" : "Ltd";
  const rand = randomBytes(2).toString("hex");
  return `${setCode}-${condShort}-${edShort}-${rand}`;
}

function generateSlug(cardName: string): string {
  return cardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("inventory")
      .select("*")
      .order("date_added", { ascending: false });

    if (error) throw error;
    return NextResponse.json((data || []).map(mapRow));
  } catch (e) {
    console.error("[admin/inventory] GET failed:", e);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const sb = getServiceSupabase();

    const id = generateId(body.setCode, body.condition, body.edition);
    const row = {
      id,
      card_name: body.cardName,
      set_code: body.setCode,
      set_name: body.setName,
      rarity: body.rarity,
      edition: body.edition,
      condition: body.condition,
      price: body.price,
      cost: body.cost || null,
      quantity: body.quantity,
      language: body.language || "English",
      date_added: new Date().toISOString().split("T")[0],
      game: body.game,
      slug: generateSlug(body.cardName),
      image_url: body.imageUrl || null,
      pricing_rule: body.pricingRule || null,
    };

    const { data, error } = await sb.from("inventory").insert(row).select().single();
    if (error) throw error;

    await logActivity("card_added", user?.username || "unknown", `Added "${body.cardName}" (${body.setCode})`, {
      itemId: id,
      cardName: body.cardName,
      price: body.price,
    });

    return NextResponse.json({ success: true, item: mapRow(data) }, { status: 201 });
  } catch (e) {
    console.error("[admin/inventory] POST failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to add item" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item id is required" },
        { status: 400 }
      );
    }

    const sb = getServiceSupabase();

    // Map camelCase to snake_case for Supabase
    const dbUpdates: Record<string, unknown> = {};
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
    if (updates.edition !== undefined) dbUpdates.edition = updates.edition;
    if (updates.cardName !== undefined) dbUpdates.card_name = updates.cardName;
    if (updates.setCode !== undefined) dbUpdates.set_code = updates.setCode;
    if (updates.setName !== undefined) dbUpdates.set_name = updates.setName;
    if (updates.rarity !== undefined) dbUpdates.rarity = updates.rarity;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.pricingRule !== undefined) dbUpdates.pricing_rule = updates.pricingRule;

    const { data, error } = await sb
      .from("inventory")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logActivity("card_updated", user?.username || "unknown", `Updated card (${id})`, {
      itemId: id,
      changes: updates,
    });

    return NextResponse.json({ success: true, item: mapRow(data) });
  } catch (e) {
    console.error("[admin/inventory] PUT failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to update item" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item id is required as query parameter" },
        { status: 400 }
      );
    }

    const sb = getServiceSupabase();

    // Get item name before deleting for the log
    const { data: item } = await sb.from("inventory").select("card_name").eq("id", id).single();

    const { error } = await sb.from("inventory").delete().eq("id", id);
    if (error) throw error;

    await logActivity("card_deleted", user?.username || "unknown", `Deleted "${item?.card_name || id}" (${id})`, {
      itemId: id,
      cardName: item?.card_name,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/inventory] DELETE failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 400 }
    );
  }
}
