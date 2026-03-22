import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { InventoryItem, AccessoryItem } from "@/lib/types";

const INVENTORY_FILE = path.join(process.cwd(), "data", "inventory.json");
const ACCESSORIES_FILE = path.join(process.cwd(), "data", "accessories.json");

function readInventory(): InventoryItem[] {
  try {
    const raw = fs.readFileSync(INVENTORY_FILE, "utf-8");
    return JSON.parse(raw) as InventoryItem[];
  } catch {
    return [];
  }
}

function readAccessories(): AccessoryItem[] {
  try {
    const raw = fs.readFileSync(ACCESSORIES_FILE, "utf-8");
    return JSON.parse(raw) as AccessoryItem[];
  } catch {
    return [];
  }
}

export type AlertUrgency = "critical" | "warning" | "low";

export interface LowStockAlertItem {
  id: string;
  name: string;
  quantity: number;
  type: "card" | "accessory";
  game?: string;
  urgency: AlertUrgency;
}

export interface AlertsResponse {
  items: LowStockAlertItem[];
  summary: {
    critical: number;
    warning: number;
    low: number;
    total: number;
  };
}

function getUrgency(quantity: number): AlertUrgency {
  if (quantity === 0) return "critical";
  if (quantity <= 2) return "warning";
  return "low";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threshold = parseInt(searchParams.get("threshold") || "5", 10);

  const inventory = readInventory();
  const accessories = readAccessories();

  const alertItems: LowStockAlertItem[] = [];

  // Check inventory cards
  for (const item of inventory) {
    if (item.quantity <= threshold) {
      alertItems.push({
        id: item.id,
        name: item.cardName,
        quantity: item.quantity,
        type: "card",
        game: item.game,
        urgency: getUrgency(item.quantity),
      });
    }
  }

  // Check accessories
  for (const item of accessories) {
    if (item.quantity <= threshold) {
      alertItems.push({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        type: "accessory",
        game: item.game || undefined,
        urgency: getUrgency(item.quantity),
      });
    }
  }

  // Sort: critical first, then warning, then low
  const urgencyOrder: Record<AlertUrgency, number> = { critical: 0, warning: 1, low: 2 };
  alertItems.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  const summary = {
    critical: alertItems.filter((i) => i.urgency === "critical").length,
    warning: alertItems.filter((i) => i.urgency === "warning").length,
    low: alertItems.filter((i) => i.urgency === "low").length,
    total: alertItems.length,
  };

  return NextResponse.json({ items: alertItems, summary } as AlertsResponse);
}
