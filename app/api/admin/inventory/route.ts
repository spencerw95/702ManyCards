import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { InventoryItem, CardCondition, CardEdition } from "@/lib/types";
import { CONDITION_SHORT } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const INVENTORY_FILE = path.join(process.cwd(), "data", "inventory.json");

function readInventory(): InventoryItem[] {
  try {
    const raw = fs.readFileSync(INVENTORY_FILE, "utf-8");
    return JSON.parse(raw) as InventoryItem[];
  } catch {
    return [];
  }
}

function writeInventory(items: InventoryItem[]): void {
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(items, null, 2), "utf-8");
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
  const items = readInventory();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const items = readInventory();

    const newItem: InventoryItem = {
      id: generateId(body.setCode, body.condition, body.edition),
      cardName: body.cardName,
      setCode: body.setCode,
      setName: body.setName,
      rarity: body.rarity,
      edition: body.edition,
      condition: body.condition,
      price: body.price,
      cost: body.cost || undefined,
      quantity: body.quantity,
      language: body.language || "English",
      dateAdded: new Date().toISOString().split("T")[0],
      game: body.game,
      slug: generateSlug(body.cardName),
      imageUrl: body.imageUrl || undefined,
      pricingRule: body.pricingRule || undefined,
    };

    items.push(newItem);
    writeInventory(items);

    logActivity("card_added", user?.username || "unknown", `Added "${body.cardName}" (${body.setCode})`, {
      itemId: newItem.id,
      cardName: body.cardName,
      price: body.price,
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
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

    const items = readInventory();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const oldItem = { ...items[index] };
    items[index] = { ...items[index], ...updates, id };
    writeInventory(items);

    logActivity("card_updated", user?.username || "unknown", `Updated "${oldItem.cardName}" (${id})`, {
      itemId: id,
      cardName: oldItem.cardName,
      changes: updates,
    });

    return NextResponse.json({ success: true, item: items[index] });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

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

  const items = readInventory();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  }

  const deleted = items[index];
  items.splice(index, 1);
  writeInventory(items);

  logActivity("card_deleted", user?.username || "unknown", `Deleted "${deleted.cardName}" (${id})`, {
    itemId: id,
    cardName: deleted.cardName,
  });

  return NextResponse.json({ success: true });
}
