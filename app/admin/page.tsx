"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { InventoryItem, Order } from "@/lib/types";
import type { ActivityEntry } from "@/lib/activity-log";
import LowStockAlert from "@/components/admin/LowStockAlert";

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  login: { icon: "->", color: "var(--color-text-muted)" },
  logout: { icon: "<-", color: "var(--color-text-muted)" },
  card_added: { icon: "+", color: "var(--color-success)" },
  card_updated: { icon: "~", color: "var(--color-primary)" },
  card_deleted: { icon: "x", color: "var(--color-danger)" },
  accessory_added: { icon: "+", color: "var(--color-success)" },
  accessory_updated: { icon: "~", color: "var(--color-primary)" },
  accessory_deleted: { icon: "x", color: "var(--color-danger)" },
  csv_uploaded: { icon: "^", color: "var(--color-accent)" },
  order_status_updated: { icon: "~", color: "var(--color-primary)" },
  order_created: { icon: "+", color: "var(--color-success)" },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboardPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, ordRes, actRes] = await Promise.all([
          fetch("/api/admin/inventory"),
          fetch("/api/admin/orders"),
          fetch("/api/admin/activity?limit=10"),
        ]);
        const invData = await invRes.json();
        const ordData = await ordRes.json();
        const actData = await actRes.json();
        setInventory(Array.isArray(invData) ? invData : []);
        setOrders(Array.isArray(ordData) ? ordData : []);
        setActivity(actData.entries || []);
      } catch {
        // fail silently
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalOrders = orders.length;
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStock = inventory.filter((item) => item.quantity <= 2).length;
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: "Cards in Stock", value: totalCards.toLocaleString(), icon: "📦", color: "var(--color-primary)" },
    { label: "Total Orders", value: totalOrders.toLocaleString(), icon: "📋", color: "var(--color-accent)" },
    { label: "Revenue", value: formatCurrency(revenue), icon: "💰", color: "var(--color-success)" },
    { label: "Low Stock Items", value: lowStock.toLocaleString(), icon: "⚠️", color: "var(--color-warning)" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius-lg)] skeleton" />
          ))}
        </div>
        <div className="h-64 rounded-[var(--radius-lg)] skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      <LowStockAlert />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Recent Activity</h2>
            <Link href="/admin/activity" className="text-xs text-[var(--color-primary)] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {activity.length === 0 ? (
              <p className="p-5 text-sm text-[var(--color-text-muted)]">No activity yet</p>
            ) : (
              activity.map((entry) => {
                const iconInfo = ACTION_ICONS[entry.action] || { icon: "?", color: "var(--color-text-muted)" };
                return (
                  <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: iconInfo.color }}
                    >
                      {iconInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text)] truncate">{entry.details}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {entry.username} &middot; {formatRelativeTime(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[var(--color-primary)] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentOrders.length === 0 ? (
              <p className="p-5 text-sm text-[var(--color-text-muted)]">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {order.customer.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} &middot; {formatRelativeTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || ""}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
