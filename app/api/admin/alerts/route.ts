import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

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
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threshold = parseInt(searchParams.get("threshold") || "5", 10);

  const sb = getServiceSupabase();

  const [{ data: inventory }, { data: accessories }] = await Promise.all([
    sb.from("inventory").select("id, card_name, quantity, game").lte("quantity", threshold),
    sb.from("accessories").select("id, name, quantity, game").lte("quantity", threshold),
  ]);

  const alertItems: LowStockAlertItem[] = [];

  for (const item of inventory || []) {
    alertItems.push({
      id: item.id,
      name: item.card_name,
      quantity: item.quantity,
      type: "card",
      game: item.game || undefined,
      urgency: getUrgency(item.quantity),
    });
  }

  for (const item of accessories || []) {
    alertItems.push({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      type: "accessory",
      game: item.game || undefined,
      urgency: getUrgency(item.quantity),
    });
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
