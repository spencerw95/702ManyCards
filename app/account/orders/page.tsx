"use client";

import { useState, useEffect } from "react";

interface OrderItem {
  inventoryId: string;
  cardName: string;
  setCode: string;
  condition: string;
  edition: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-[var(--radius-lg)] skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-[var(--color-text-muted)]">You haven&apos;t placed any orders yet.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          {/* Table header — desktop only */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            <div>Order ID</div>
            <div>Date</div>
            <div>Items</div>
            <div>Total</div>
            <div>Status</div>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div key={order.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                  >
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center">
                      <div className="text-sm font-medium text-[var(--color-text)]">{order.id}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{itemCount}</div>
                      <div className="text-sm font-semibold text-[var(--color-text)]">${order.total.toFixed(2)}</div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {/* Mobile */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">{order.id}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {new Date(order.createdAt).toLocaleDateString()} &middot; {itemCount} items
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-text)]">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-[var(--color-bg-secondary)]/50">
                      <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-muted)] uppercase">
                              <th className="text-left px-3 py-2">Card</th>
                              <th className="text-left px-3 py-2 hidden sm:table-cell">Set</th>
                              <th className="text-left px-3 py-2 hidden sm:table-cell">Condition</th>
                              <th className="text-right px-3 py-2">Qty</th>
                              <th className="text-right px-3 py-2">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border)]">
                            {order.items.map((item, idx) => (
                              <tr key={idx} className="bg-[var(--color-bg-card)]">
                                <td className="px-3 py-2 text-[var(--color-text)]">{item.cardName}</td>
                                <td className="px-3 py-2 text-[var(--color-text-secondary)] hidden sm:table-cell">{item.setCode}</td>
                                <td className="px-3 py-2 text-[var(--color-text-secondary)] hidden sm:table-cell">{item.condition}</td>
                                <td className="px-3 py-2 text-right text-[var(--color-text-secondary)]">{item.quantity}</td>
                                <td className="px-3 py-2 text-right text-[var(--color-text)]">${(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex justify-end gap-6 text-sm">
                        <div className="text-[var(--color-text-muted)]">
                          Subtotal: <span className="text-[var(--color-text)]">${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="text-[var(--color-text-muted)]">
                          Shipping: <span className="text-[var(--color-text)]">${order.shipping.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="text-[var(--color-success)]">
                            Discount: -${order.discount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
