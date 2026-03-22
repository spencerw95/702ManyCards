import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { InventoryItem } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const INVENTORY_FILE = path.join(process.cwd(), "data", "inventory.json");

const YGOPRODECK_API = "https://db.ygoprodeck.com/api/v7/cardinfo.php";

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

interface BulkPriceRequest {
  action: "preview" | "apply";
  rule: "percentage" | "fixed";
  value: number;
  direction: "below" | "above";
  minPrice: number;
  maxDiscount: number;
  game: string | null;
  selectedIds: string[] | null;
}

interface PriceChange {
  id: string;
  cardName: string;
  setCode: string;
  game: string;
  currentPrice: number;
  marketPrice: number;
  newPrice: number;
  changeDollar: number;
  changePercent: number;
}

async function fetchMarketPrice(cardName: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${YGOPRODECK_API}?name=${encodeURIComponent(cardName)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const card = data?.data?.[0];
    if (!card?.card_prices?.[0]) return null;
    const price = parseFloat(card.card_prices[0].tcgplayer_price);
    return isNaN(price) || price <= 0 ? null : price;
  } catch {
    return null;
  }
}

function calculateNewPrice(
  marketPrice: number,
  rule: "percentage" | "fixed",
  value: number,
  direction: "below" | "above",
  minPrice: number,
  maxDiscount: number,
  currentPrice: number
): number {
  let newPrice: number;

  if (direction === "below") {
    if (rule === "percentage") {
      newPrice = marketPrice * (1 - value / 100);
    } else {
      newPrice = marketPrice - value;
    }
  } else {
    if (rule === "percentage") {
      newPrice = marketPrice * (1 + value / 100);
    } else {
      newPrice = marketPrice + value;
    }
  }

  // Apply minimum price floor
  if (newPrice < minPrice) {
    newPrice = minPrice;
  }

  // Apply maximum discount cap (only when pricing below market)
  if (direction === "below" && maxDiscount > 0) {
    const maxDiscountPrice = marketPrice * (1 - maxDiscount / 100);
    if (newPrice < maxDiscountPrice) {
      newPrice = maxDiscountPrice;
    }
  }

  // Round to 2 decimal places
  return Math.round(newPrice * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body: BulkPriceRequest = await request.json();

    const { action, rule, value, direction, minPrice, maxDiscount, game, selectedIds } = body;

    if (!action || !rule || value === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const items = readInventory();

    // Filter items by game if specified
    let targetItems = game ? items.filter((item) => item.game === game) : [...items];

    // Filter by selected IDs if applying to selected only
    if (selectedIds && selectedIds.length > 0) {
      targetItems = targetItems.filter((item) => selectedIds.includes(item.id));
    }

    // Only Yu-Gi-Oh cards can get live market prices
    const yugiohItems = targetItems.filter((item) => item.game === "yugioh");
    const otherItems = targetItems.filter((item) => item.game !== "yugioh");

    // Fetch market prices for Yu-Gi-Oh cards (batch with concurrency limit)
    const BATCH_SIZE = 10;
    const priceChanges: PriceChange[] = [];

    for (let i = 0; i < yugiohItems.length; i += BATCH_SIZE) {
      const batch = yugiohItems.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (item) => {
          const marketPrice = await fetchMarketPrice(item.cardName);
          return { item, marketPrice };
        })
      );

      for (const { item, marketPrice } of results) {
        if (marketPrice === null) continue;

        const newPrice = calculateNewPrice(
          marketPrice,
          rule,
          value,
          direction,
          minPrice,
          maxDiscount,
          item.price
        );

        const changeDollar = newPrice - item.price;
        const changePercent =
          item.price > 0 ? ((newPrice - item.price) / item.price) * 100 : 0;

        priceChanges.push({
          id: item.id,
          cardName: item.cardName,
          setCode: item.setCode,
          game: item.game,
          currentPrice: item.price,
          marketPrice,
          newPrice,
          changeDollar: Math.round(changeDollar * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        });
      }
    }

    // For non-Yu-Gi-Oh cards, use their current price as "market price" (no API available)
    for (const item of otherItems) {
      const newPrice = calculateNewPrice(
        item.price,
        rule,
        value,
        direction,
        minPrice,
        maxDiscount,
        item.price
      );

      const changeDollar = newPrice - item.price;
      const changePercent =
        item.price > 0 ? ((newPrice - item.price) / item.price) * 100 : 0;

      priceChanges.push({
        id: item.id,
        cardName: item.cardName,
        setCode: item.setCode,
        game: item.game,
        currentPrice: item.price,
        marketPrice: item.price,
        newPrice,
        changeDollar: Math.round(changeDollar * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      });
    }

    if (action === "preview") {
      const totalAffected = priceChanges.filter((c) => c.changeDollar !== 0).length;
      const avgChange =
        priceChanges.length > 0
          ? priceChanges.reduce((sum, c) => sum + c.changePercent, 0) / priceChanges.length
          : 0;

      return NextResponse.json({
        success: true,
        changes: priceChanges,
        summary: {
          totalItems: priceChanges.length,
          totalAffected,
          averageChangePercent: Math.round(avgChange * 100) / 100,
          yugiohWithMarketData: priceChanges.filter((c) => c.game === "yugioh").length,
          otherGamesStoredPrice: otherItems.length,
        },
      });
    }

    // action === "apply"
    const allItems = readInventory();
    let updatedCount = 0;

    for (const change of priceChanges) {
      const idx = allItems.findIndex((item) => item.id === change.id);
      if (idx !== -1 && change.newPrice !== change.currentPrice) {
        allItems[idx].price = change.newPrice;
        updatedCount++;
      }
    }

    writeInventory(allItems);

    const avgChangePercent =
      priceChanges.length > 0
        ? priceChanges.reduce((sum, c) => sum + c.changePercent, 0) / priceChanges.length
        : 0;

    logActivity(
      "card_updated" as any,
      user?.username || "unknown",
      `Bulk price update: ${updatedCount} cards updated (${direction === "below" ? "-" : "+"}${rule === "percentage" ? value + "%" : "$" + value} ${direction} market, min $${minPrice}, max ${maxDiscount}% discount)`,
      {
        updatedCount,
        rule,
        value,
        direction,
        minPrice,
        maxDiscount,
        game: game || "all",
        averageChangePercent: Math.round(avgChangePercent * 100) / 100,
      }
    );

    return NextResponse.json({
      success: true,
      summary: {
        updatedCount,
        totalProcessed: priceChanges.length,
        averageChangePercent: Math.round(avgChangePercent * 100) / 100,
      },
    });
  } catch (err) {
    console.error("Bulk price update error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process bulk price update" },
      { status: 500 }
    );
  }
}
