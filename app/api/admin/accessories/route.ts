import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { AccessoryItem, AccessoryCategory } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getServiceSupabase } from "@/lib/supabase";

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

function generateId(): string {
  return `ACC-${Date.now()}-${randomBytes(2).toString("hex")}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("accessories")
      .select("*")
      .order("date_added", { ascending: false });

    if (error) throw error;
    return NextResponse.json((data || []).map(mapRow));
  } catch (e) {
    console.error("[admin/accessories] GET failed:", e);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const sb = getServiceSupabase();

    const row = {
      id: generateId(),
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory || null,
      price: body.price,
      cost: body.cost != null ? body.cost : null,
      quantity: body.quantity,
      image_url: body.imageUrl || null,
      brand: body.brand || null,
      color: body.color || null,
      game: body.game || null,
      set_name: body.setName || null,
      date_added: new Date().toISOString().split("T")[0],
      slug: generateSlug(body.name),
    };

    const { data, error } = await sb.from("accessories").insert(row).select().single();
    if (error) throw error;

    await logActivity("accessory_added", user?.username || "unknown", `Added accessory "${body.name}"`, { itemId: row.id });

    return NextResponse.json({ success: true, item: data }, { status: 201 });
  } catch (e) {
    console.error("[admin/accessories] POST failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to add accessory" },
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

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.game !== undefined) dbUpdates.game = updates.game;
    if (updates.setName !== undefined) dbUpdates.set_name = updates.setName;

    const { data, error } = await sb
      .from("accessories")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logActivity("accessory_updated", user?.username || "unknown", `Updated accessory (${id})`, { itemId: id, changes: updates });

    return NextResponse.json({ success: true, item: data });
  } catch (e) {
    console.error("[admin/accessories] PUT failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to update accessory" },
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

    const { data: item } = await sb.from("accessories").select("name").eq("id", id).single();
    const { error } = await sb.from("accessories").delete().eq("id", id);
    if (error) throw error;

    await logActivity("accessory_deleted", user?.username || "unknown", `Deleted accessory "${item?.name || id}"`, { itemId: id });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/accessories] DELETE failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete accessory" },
      { status: 400 }
    );
  }
}
