"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  wishlist: string[];
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: { cardName: string; quantity: number }[];
}

export default function AccountDashboard() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/customer/profile").then((r) => r.json()),
      fetch("/api/customer/orders").then((r) => r.json()),
    ])
      .then(([profileData, ordersData]) => {
        if (profileData.success) setCustomer(profileData.customer);
        if (ordersData.success) setOrders(ordersData.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[var(--radius-lg)] skeleton" />
        ))}
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Welcome back, {customer?.name}!
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Manage your account, track orders, and more.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <div className="text-2xl font-bold text-[var(--color-text)]">{orders.length}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Total Orders</div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <div className="text-2xl font-bold text-[var(--color-text)]">{customer?.wishlist.length || 0}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Wishlist Items</div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <div className="text-2xl font-bold text-[var(--color-text)]">
            ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">Total Spent</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/account/settings"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-center"
        >
          <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Edit Profile</span>
        </Link>
        <Link
          href="/account/orders"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-center"
        >
          <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">View Orders</span>
        </Link>
        <Link
          href="/account/wishlist"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-center"
        >
          <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Wishlist</span>
        </Link>
        <Link
          href="/sell"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-center"
        >
          <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Sell Cards</span>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Recent Orders</h2>
          {orders.length > 3 && (
            <Link href="/account/orders" className="text-sm text-[var(--color-primary)] hover:underline">
              View all
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            <p>No orders yet.</p>
            <Link href="/search" className="text-[var(--color-primary)] hover:underline text-sm mt-1 inline-block">
              Browse cards
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[var(--color-text)]">{order.id}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {new Date(order.createdAt).toLocaleDateString()} &middot;{" "}
                    {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
