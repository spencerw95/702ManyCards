import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/orders";
import { getUserFromRequest } from "@/lib/auth";
import type { Order, OrderItem } from "@/lib/types";

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface TopSeller {
  cardName: string;
  game: string;
  quantitySold: number;
  revenue: number;
  avgPrice: number;
}

interface GameBreakdown {
  game: string;
  label: string;
  revenue: number;
  orders: number;
  percentage: number;
}

interface ProfitCard {
  cardName: string;
  setCode: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface ReportsData {
  summary: {
    totalRevenue: number;
    revenueThisMonth: number;
    ordersThisMonth: number;
    avgOrderValue: number;
    totalOrders: number;
    totalProfit: number | null;
  };
  dailyRevenue: DailyRevenue[];
  topSellers: TopSeller[];
  gameBreakdown: GameBreakdown[];
  recentOrders: Order[];
  profitMargins: {
    overall: number | null;
    mostProfitable: ProfitCard[];
    leastProfitable: ProfitCard[];
  };
}

const GAME_LABELS: Record<string, string> = {
  yugioh: "Yu-Gi-Oh!",
  pokemon: "Pokemon",
  mtg: "Magic: The Gathering",
  accessories: "Accessories",
  unknown: "Other",
};

function guessGameFromItem(item: OrderItem): string {
  // Try to infer game from set code patterns
  const code = (item.setCode || "").toUpperCase();
  if (!code || code === "ACC" || code === "ACCESSORY") return "accessories";
  // Pokemon sets are often like "SV06", "SWSH", etc.
  if (/^(SV|SWSH|SM|XY|BW|DP|EX|RS|LC|BS|JU|FO|TR|GY|G1|G2|NE|DET|CEL|GO|CRZ|PAL|OBF|MEW|PAR|TEF|TWM|SFA|SSP|SCR|PRE|PRO|SVI|PAF)/.test(code)) return "pokemon";
  // MTG sets are typically 3 letters
  if (/^[A-Z]{3}$/.test(code) && !/^(LOB|MRD|DCR|IOC|AST|SOD|RDS|FET|TLM|CRV|SOI|EOJ|POTD|CDIP|STON|FOTB|TAEV|GLAS|PTDN|LODT|TDGS|CSOC|RGBT|ANPR|SOVR|ABPF)/.test(code)) return "mtg";
  // Default to yugioh
  return "yugioh";
}

/**
 * GET: Return comprehensive sales report data.
 * Query params: ?days=30 (default 30)
 */
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "30", 10);

  const allOrders = await getAllOrders();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter out cancelled orders for revenue calculations
  const activeOrders = allOrders.filter((o) => o.status !== "cancelled");

  // --- Summary ---
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);

  const monthOrders = activeOrders.filter(
    (o) => new Date(o.createdAt) >= monthStart
  );
  const revenueThisMonth = monthOrders.reduce((sum, o) => sum + o.total, 0);
  const ordersThisMonth = monthOrders.length;
  const avgOrderValue = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

  // Calculate total profit if cost data exists on items
  let totalCost = 0;
  let hasCostData = false;
  for (const order of activeOrders) {
    for (const item of order.items) {
      // OrderItem doesn't have cost, so we can't compute per-item cost from orders alone
      // We'll just report null for profit unless we find cost data
    }
  }

  // --- Daily Revenue (last N days) ---
  const dailyMap = new Map<string, DailyRevenue>();
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const key = date.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, revenue: 0, orders: 0 });
  }

  for (const order of activeOrders) {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      const entry = dailyMap.get(key)!;
      entry.revenue += order.total;
      entry.orders += 1;
    }
  }

  const dailyRevenue = Array.from(dailyMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  // --- Top Sellers ---
  const cardSales = new Map<string, { cardName: string; game: string; quantity: number; revenue: number }>();

  for (const order of activeOrders) {
    for (const item of order.items) {
      const key = `${item.cardName}||${item.setCode}`;
      const existing = cardSales.get(key) || {
        cardName: item.cardName,
        game: guessGameFromItem(item),
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      cardSales.set(key, existing);
    }
  }

  const topSellers: TopSeller[] = Array.from(cardSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((s) => ({
      cardName: s.cardName,
      game: GAME_LABELS[s.game] || s.game,
      quantitySold: s.quantity,
      revenue: s.revenue,
      avgPrice: s.quantity > 0 ? s.revenue / s.quantity : 0,
    }));

  // --- Sales by Game ---
  const gameMap = new Map<string, { revenue: number; orders: number }>();

  for (const order of activeOrders) {
    // Determine dominant game per order from items
    const gameCounts = new Map<string, number>();
    for (const item of order.items) {
      const g = guessGameFromItem(item);
      gameCounts.set(g, (gameCounts.get(g) || 0) + item.quantity);
    }

    // Attribute revenue per item to its game
    for (const item of order.items) {
      const g = guessGameFromItem(item);
      const existing = gameMap.get(g) || { revenue: 0, orders: 0 };
      existing.revenue += item.price * item.quantity;
      gameMap.set(g, existing);
    }

    // Count orders per dominant game
    let dominant = "unknown";
    let maxCount = 0;
    for (const [g, c] of gameCounts) {
      if (c > maxCount) {
        dominant = g;
        maxCount = c;
      }
    }
    const domEntry = gameMap.get(dominant) || { revenue: 0, orders: 0 };
    domEntry.orders += 1;
    gameMap.set(dominant, domEntry);
  }

  const totalGameRevenue = Array.from(gameMap.values()).reduce((s, g) => s + g.revenue, 0);

  const gameBreakdown: GameBreakdown[] = Array.from(gameMap.entries())
    .map(([game, data]) => ({
      game,
      label: GAME_LABELS[game] || game,
      revenue: data.revenue,
      orders: data.orders,
      percentage: totalGameRevenue > 0 ? (data.revenue / totalGameRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // --- Recent Orders (last 10) ---
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  // --- Profit Margins ---
  // Since OrderItem doesn't have cost data, we report null unless items have cost
  const profitCards: ProfitCard[] = [];
  // We can still try if we ever get cost data through the items

  const data: ReportsData = {
    summary: {
      totalRevenue,
      revenueThisMonth,
      ordersThisMonth,
      avgOrderValue,
      totalOrders: allOrders.length,
      totalProfit: hasCostData ? totalRevenue - totalCost : null,
    },
    dailyRevenue,
    topSellers,
    gameBreakdown,
    recentOrders,
    profitMargins: {
      overall: null,
      mostProfitable: profitCards.slice(0, 5),
      leastProfitable: profitCards.slice(-5).reverse(),
    },
  };

  return NextResponse.json(data);
}
