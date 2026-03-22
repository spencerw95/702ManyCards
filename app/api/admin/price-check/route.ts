import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { InventoryItem } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

const INVENTORY_FILE = path.join(process.cwd(), "data", "inventory.json");

function readInventory(): InventoryItem[] {
  try {
    const raw = fs.readFileSync(INVENTORY_FILE, "utf-8");
    return JSON.parse(raw) as InventoryItem[];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  // Admin-only endpoint
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = getServiceSupabase();

  // Get all active (not yet notified) price alerts
  const { data: alerts, error: fetchError } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("notified", false);

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({
      success: true,
      triggered: [],
      checked: 0,
      message: "No active price alerts",
    });
  }

  // Load current inventory to get latest prices
  const inventory = readInventory();

  // Build a slug -> lowest price map
  const priceMap = new Map<string, number>();
  for (const item of inventory) {
    if (item.quantity <= 0) continue;
    const existing = priceMap.get(item.slug);
    if (existing === undefined || item.price < existing) {
      priceMap.set(item.slug, item.price);
    }
  }

  const triggered: Array<{
    id: string;
    customer_email: string;
    card_name: string;
    slug: string;
    target_price: number;
    current_price: number;
  }> = [];

  const updatePromises: PromiseLike<unknown>[] = [];

  for (const alert of alerts) {
    const currentPrice = priceMap.get(alert.slug);

    if (currentPrice !== undefined) {
      // Update current_price on the alert
      updatePromises.push(
        supabase
          .from("price_alerts")
          .update({ current_price: currentPrice })
          .eq("id", alert.id)
      );

      // Check if price has dropped to or below target
      if (currentPrice <= alert.target_price) {
        triggered.push({
          id: alert.id,
          customer_email: alert.customer_email,
          card_name: alert.card_name,
          slug: alert.slug,
          target_price: alert.target_price,
          current_price: currentPrice,
        });
      }
    }
  }

  // Wait for current_price updates
  await Promise.all(updatePromises);

  // Mark triggered alerts as notified
  if (triggered.length > 0) {
    const triggeredIds = triggered.map((t) => t.id);
    await supabase
      .from("price_alerts")
      .update({ notified: true })
      .in("id", triggeredIds);
  }

  return NextResponse.json({
    success: true,
    triggered,
    checked: alerts.length,
    message: `Checked ${alerts.length} alerts, ${triggered.length} triggered`,
  });
}
