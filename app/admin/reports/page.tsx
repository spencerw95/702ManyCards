"use client";

import { useState, useEffect } from "react";

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

interface RecentOrder {
  id: string;
  customer: { name: string; email: string };
  total: number;
  status: string;
  createdAt: string;
  items: { cardName: string; quantity: number; price: number }[];
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
  recentOrders: RecentOrder[];
  profitMargins: {
    overall: number | null;
    mostProfitable: { cardName: string; margin: number; profit: number; revenue: number }[];
    leastProfitable: { cardName: string; margin: number; profit: number; revenue: number }[];
  };
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const GAME_COLORS: Record<string, string> = {
  yugioh: "var(--color-primary)",
  pokemon: "#f59e0b",
  mtg: "#8b5cf6",
  accessories: "#10b981",
  unknown: "var(--color-text-muted)",
};

const GAME_BAR_COLORS: Record<string, string> = {
  yugioh: "var(--color-primary)",
  pokemon: "#f59e0b",
  mtg: "#8b5cf6",
  accessories: "#10b981",
  unknown: "#6b7280",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/reports?days=${days}`);
        const json = await res.json();
        setData(json);
      } catch {
        // fail silently
      }
      setLoading(false);
    }
    fetchReports();
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius-lg)] skeleton" />
          ))}
        </div>
        <div className="h-72 rounded-[var(--radius-lg)] skeleton" />
        <div className="h-64 rounded-[var(--radius-lg)] skeleton" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        Failed to load reports data.
      </div>
    );
  }

  const { summary, dailyRevenue, topSellers, gameBreakdown, recentOrders, profitMargins } = data;
  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  const summaryCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "var(--color-success)",
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(summary.revenueThisMonth),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
      color: "var(--color-primary)",
    },
    {
      label: "Orders This Month",
      value: summary.ordersThisMonth.toLocaleString(),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      color: "var(--color-accent)",
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(summary.avgOrderValue),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      color: "var(--color-warning)",
    },
    {
      label: summary.totalProfit !== null ? "Total Profit" : "Total Orders",
      value: summary.totalProfit !== null ? formatCurrency(summary.totalProfit) : summary.totalOrders.toLocaleString(),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
        </svg>
      ),
      color: summary.totalProfit !== null ? "var(--color-success)" : "var(--color-text-muted)",
    },
  ];

  // Determine which date labels to show (every 5th or so)
  const labelInterval = Math.max(1, Math.floor(dailyRevenue.length / 7));

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          Sales overview for the last {days} days
        </p>
        <div className="flex gap-1">
          {[7, 14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] transition-colors cursor-pointer ${
                days === d
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-medium">
                {card.label}
              </p>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Daily Revenue</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Revenue by day for the last {days} days</p>
        </div>
        <div className="p-5">
          {dailyRevenue.every((d) => d.revenue === 0) ? (
            <div className="flex items-center justify-center h-48 text-[var(--color-text-muted)] text-sm">
              No revenue data for this period
            </div>
          ) : (
            <div className="relative">
              {/* Y-axis labels */}
              <div className="flex items-end gap-[2px]" style={{ height: "200px", alignItems: "flex-end" }}>
                {dailyRevenue.map((day, i) => {
                  const heightPercent = maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 0;
                  const barHeight = Math.max(heightPercent > 0 ? 2 : 0, (heightPercent / 100) * 180);
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center justify-end relative group"
                      style={{ height: "100%" }}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {hoveredBar === i && (
                        <div
                          className="absolute bottom-full mb-2 px-3 py-2 rounded-[var(--radius)] text-xs font-medium z-10 whitespace-nowrap pointer-events-none"
                          style={{
                            backgroundColor: "var(--color-bg-secondary)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text)",
                            boxShadow: "var(--shadow-md)",
                          }}
                        >
                          <div className="font-semibold">{formatShortDate(day.date)}</div>
                          <div style={{ color: "var(--color-success)" }}>{formatCurrency(day.revenue)}</div>
                          <div className="text-[var(--color-text-muted)]">{day.orders} order{day.orders !== 1 ? "s" : ""}</div>
                        </div>
                      )}
                      {/* Bar */}
                      <div
                        className="w-full rounded-t-sm transition-all duration-150"
                        style={{
                          height: `${barHeight}px`,
                          backgroundColor: hoveredBar === i ? "var(--color-primary)" : "var(--color-primary)",
                          opacity: hoveredBar === i ? 1 : 0.7,
                          minWidth: "4px",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X-axis date labels */}
              <div className="flex gap-[2px] mt-2">
                {dailyRevenue.map((day, i) => (
                  <div key={day.date} className="flex-1 text-center">
                    {i % labelInterval === 0 ? (
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {formatShortDate(day.date)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Top Sellers</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Best-selling cards by quantity</p>
          </div>
          {topSellers.length === 0 ? (
            <div className="p-5 text-sm text-[var(--color-text-muted)]">No sales data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs">#</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs">Card</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs hidden sm:table-cell">Game</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs">Qty</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs">Revenue</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs hidden md:table-cell">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {topSellers.map((seller, i) => (
                    <tr key={i} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                      <td className="px-4 py-2.5 text-[var(--color-text-muted)] font-medium">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-[var(--color-text)] max-w-[200px] truncate">
                        {seller.cardName}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-text-secondary)] text-xs hidden sm:table-cell">
                        {seller.game}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[var(--color-text)]">
                        {seller.quantitySold}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[var(--color-success)]">
                        {formatCurrency(seller.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--color-text-secondary)] hidden md:table-cell">
                        {formatCurrency(seller.avgPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales by Game */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Sales by Game</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Revenue breakdown by TCG</p>
          </div>
          {gameBreakdown.length === 0 ? (
            <div className="p-5 text-sm text-[var(--color-text-muted)]">No sales data yet</div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Stacked bar */}
              <div className="w-full h-8 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                {gameBreakdown.map((g) => (
                  <div
                    key={g.game}
                    className="h-full transition-all duration-300 relative group"
                    style={{
                      width: `${Math.max(g.percentage, g.percentage > 0 ? 2 : 0)}%`,
                      backgroundColor: GAME_BAR_COLORS[g.game] || GAME_BAR_COLORS.unknown,
                    }}
                    title={`${g.label}: ${formatCurrency(g.revenue)} (${g.percentage.toFixed(1)}%)`}
                  />
                ))}
              </div>

              {/* Legend and details */}
              <div className="space-y-3">
                {gameBreakdown.map((g) => (
                  <div key={g.game} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: GAME_BAR_COLORS[g.game] || GAME_BAR_COLORS.unknown }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--color-text)]">{g.label}</span>
                        <span className="text-sm font-semibold text-[var(--color-text)]">
                          {formatCurrency(g.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {g.orders} order{g.orders !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {g.percentage.toFixed(1)}%
                        </span>
                      </div>
                      {/* Mini bar */}
                      <div className="w-full h-1.5 rounded-full mt-1.5" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${g.percentage}%`,
                            backgroundColor: GAME_BAR_COLORS[g.game] || GAME_BAR_COLORS.unknown,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Recent Orders</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Last 10 orders</p>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-5 text-sm text-[var(--color-text-muted)]">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs">Customer</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs hidden sm:table-cell">Items</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs">Total</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-text-secondary)] text-xs hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-[var(--color-text)]">{order.customer.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{order.customer.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)] hidden sm:table-cell">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[var(--color-text)]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)] hidden md:table-cell">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profit Margins Section */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Profit Margins</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Profitability analysis</p>
        </div>
        <div className="p-5">
          {profitMargins.overall !== null ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold" style={{ color: profitMargins.overall >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                  {profitMargins.overall.toFixed(1)}%
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">Overall profit margin</p>
              </div>

              {profitMargins.mostProfitable.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Most Profitable Cards</h3>
                  <div className="space-y-2">
                    {profitMargins.mostProfitable.map((card, i) => (
                      <div key={i} className="flex items-center justify-between bg-[var(--color-bg-secondary)] rounded-[var(--radius)] px-3 py-2">
                        <span className="text-sm text-[var(--color-text)]">{card.cardName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[var(--color-success)]">
                            {formatCurrency(card.profit)}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {card.margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profitMargins.leastProfitable.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Least Profitable Cards</h3>
                  <div className="space-y-2">
                    {profitMargins.leastProfitable.map((card, i) => (
                      <div key={i} className="flex items-center justify-between bg-[var(--color-bg-secondary)] rounded-[var(--radius)] px-3 py-2">
                        <span className="text-sm text-[var(--color-text)]">{card.cardName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold" style={{ color: card.profit >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                            {formatCurrency(card.profit)}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {card.margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="w-10 h-10 text-[var(--color-text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
              </svg>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                No cost data available
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                Add cost data to your inventory items to see profit margin analysis. You can set the cost field when adding or editing cards.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
