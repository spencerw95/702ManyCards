"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // fail silently
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
        );
      }
    } catch {
      // fail silently
    }
  };

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-96 rounded-[var(--radius-lg)] skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">{orders.length} total orders</p>

      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Order ID</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden lg:table-cell">Items</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sorted.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">
                      {order.id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{order.customer.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell">{order.customer.email}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden lg:table-cell">{order.items.length}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text)]">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(order.id, e.target.value as OrderStatus);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>

                  {/* Expanded details */}
                  {expandedId === order.id && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={7} className="px-4 py-4 bg-[var(--color-bg-secondary)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Items list */}
                          <div>
                            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Items</h4>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2">
                                  <div>
                                    <p className="font-medium text-[var(--color-text)]">{item.cardName}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                      {item.setCode} &middot; {item.condition} &middot; {item.edition}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-[var(--color-text)]">{formatCurrency(item.price)}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">x{item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order info */}
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Shipping Address</h4>
                              <div className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2">
                                <p>{order.customer.name}</p>
                                <p>{order.customer.address.street}</p>
                                <p>
                                  {order.customer.address.city}, {order.customer.address.state} {order.customer.address.zip}
                                </p>
                                <p>{order.customer.address.country}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Summary</h4>
                              <div className="text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2 space-y-1">
                                <div className="flex justify-between text-[var(--color-text-secondary)]">
                                  <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-[var(--color-text-secondary)]">
                                  <span>Shipping</span><span>{formatCurrency(order.shipping)}</span>
                                </div>
                                {order.discount > 0 && (
                                  <div className="flex justify-between text-[var(--color-success)]">
                                    <span>Discount</span><span>-{formatCurrency(order.discount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-semibold text-[var(--color-text)] pt-1 border-t border-[var(--color-border)]">
                                  <span>Total</span><span>{formatCurrency(order.total)}</span>
                                </div>
                              </div>
                            </div>
                            {order.notes && (
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--color-text)] mb-1">Notes</h4>
                                <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2">
                                  {order.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
