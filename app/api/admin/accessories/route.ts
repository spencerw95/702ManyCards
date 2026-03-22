import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { AccessoryItem } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const ACCESSORIES_FILE = path.join(process.cwd(), "data", "accessories.json");

function readAccessories(): AccessoryItem[] {
  try {
    const raw = fs.readFileSync(ACCESSORIES_FILE, "utf-8");
    return JSON.parse(raw) as AccessoryItem[];
  } catch {
    return [];
  }
}

function writeAccessories(items: AccessoryItem[]): void {
  fs.writeFileSync(ACCESSORIES_FILE, JSON.stringify(items, null, 2), "utf-8");
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

/**
 * GET: Return all accessory items.
 */
export async function GET() {
  const items = readAccessories();
  return NextResponse.json(items);
}

/**
 * POST: Add a new accessory item.
 */
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const items = readAccessories();

    const newItem: AccessoryItem = {
      id: generateId(),
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory || undefined,
      price: body.price,
      cost: body.cost != null ? body.cost : undefined,
      quantity: body.quantity,
      imageUrl: body.imageUrl || undefined,
      brand: body.brand || undefined,
      color: body.color || undefined,
      game: body.game || undefined,
      setName: body.setName || undefined,
      dateAdded: new Date().toISOString().split("T")[0],
      slug: generateSlug(body.name),
    };

    items.push(newItem);
    writeAccessories(items);

    logActivity("accessory_added", user?.username || "unknown", `Added accessory "${body.name}"`, { itemId: newItem.id });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * PUT: Update an existing accessory item by id.
 */
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

    const items = readAccessories();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const oldName = items[index].name;
    items[index] = { ...items[index], ...updates, id };
    writeAccessories(items);

    logActivity("accessory_updated", user?.username || "unknown", `Updated accessory "${oldName}"`, { itemId: id, changes: updates });

    return NextResponse.json({ success: true, item: items[index] });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * DELETE: Delete an accessory item by id (query param).
 */
export async function DELETE(request: Request) {
  const user = getUserFromRequest(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Item id is required as query parameter" },
      { status: 400 }
    );
  }

  const items = readAccessories();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  }

  const deleted = items[index];
  items.splice(index, 1);
  writeAccessories(items);

  logActivity("accessory_deleted", user?.username || "unknown", `Deleted accessory "${deleted.name}"`, { itemId: id });

  return NextResponse.json({ success: true });
}
