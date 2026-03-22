"use client";

import { use, useState, useEffect } from "react";
import type { Order } from "@/lib/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#d97706" },
  processing: { label: "Processing", color: "#2563eb" },
  shipped: { label: "Shipped", color: "#7c3aed" },
  delivered: { label: "Delivered", color: "#059669" },
  cancelled: { label: "Cancelled", color: "#dc2626" },
};

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Order Not Found</h1>
        <p style={{ color: "#666" }}>The order ID provided does not exist.</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 48, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || {
    label: order.status,
    color: "#6b7280",
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          @page { margin: 0.5in; size: letter; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: 40,
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          color: "#1a1a1a",
          background: "#fff",
          minHeight: "100vh",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {/* Print Button */}
        <div className="no-print" style={{ marginBottom: 24, display: "flex", gap: 12 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 24px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Print Invoice
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: "10px 24px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {/* Header with border */}
        <div
          style={{
            border: "2px solid #111827",
            borderRadius: 8,
            padding: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.02em",
                  color: "#111827",
                }}
              >
                702ManyCards
              </h1>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                Trading Card Games
              </p>
              <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 12 }}>
                Las Vegas, NV
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  margin: 0,
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Invoice
              </h2>
            </div>
          </div>
        </div>

        {/* Invoice Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 28,
          }}
        >
          {/* Left: Bill To */}
          <div>
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9ca3af",
                margin: "0 0 8px",
              }}
            >
              Bill To
            </h3>
            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "14px 16px",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{order.customer.name}</p>
              <p style={{ margin: 0, color: "#4b5563" }}>{order.customer.email}</p>
              {order.customer.phone && (
                <p style={{ margin: 0, color: "#4b5563" }}>{order.customer.phone}</p>
              )}
              <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
                {order.customer.address.street}
              </p>
              <p style={{ margin: 0, color: "#4b5563" }}>
                {order.customer.address.city}, {order.customer.address.state}{" "}
                {order.customer.address.zip}
              </p>
              <p style={{ margin: 0, color: "#4b5563" }}>
                {order.customer.address.country}
              </p>
            </div>
          </div>

          {/* Right: Invoice Info */}
          <div>
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9ca3af",
                margin: "0 0 8px",
              }}
            >
              Invoice Details
            </h3>
            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "14px 16px",
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Invoice #</span>
                <span style={{ fontFamily: "monospace", fontSize: 12 }}>{order.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Date</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Status</span>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#fff",
                    background: statusInfo.color,
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Payment</span>
                <span style={{ fontWeight: 600, color: order.status === "cancelled" ? "#dc2626" : "#059669" }}>
                  {order.status === "cancelled" ? "Refunded" : "Paid"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#111827",
                  color: "#fff",
                }}
              >
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Card Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Set
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Condition
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Edition
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Unit Price
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    background: i % 2 === 0 ? "#fff" : "#f9fafb",
                  }}
                >
                  <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                    {item.cardName}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#4b5563",
                    }}
                  >
                    {item.setCode}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#4b5563" }}>
                    {item.condition}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#4b5563" }}>
                    {item.edition}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      textAlign: "right",
                      color: "#4b5563",
                    }}
                  >
                    {formatCurrency(item.price)}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 300,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 16px",
                fontSize: 13,
                color: "#4b5563",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 16px",
                fontSize: 13,
                color: "#4b5563",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  fontSize: 13,
                  color: "#059669",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                fontSize: 18,
                fontWeight: 800,
                background: "#111827",
                color: "#fff",
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div
            style={{
              marginBottom: 32,
              padding: 16,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#92400e",
              }}
            >
              Order Notes
            </p>
            <p style={{ margin: 0, color: "#78350f" }}>{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingTop: 24,
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 4px",
            }}
          >
            Thank you for your order!
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 2px" }}>
            702ManyCards &mdash; Las Vegas, NV
          </p>
          <p style={{ fontSize: 11, color: "#d1d5db", margin: 0 }}>
            Questions? Contact us at support@702manycards.com
          </p>
        </div>
      </div>
    </>
  );
}
