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

export default function PackingSlipPage({
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
            Print Packing Slip
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

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
            paddingBottom: 20,
            borderBottom: "2px solid #e5e7eb",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
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
          </div>
          <div style={{ textAlign: "right" }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                color: "#4b5563",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Packing Slip
            </h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 13 }}>
              Order Date: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Order Number */}
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          <strong>Order #:</strong>{" "}
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{order.id}</span>
        </div>

        {/* Addresses */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 32,
          }}
        >
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
              Ship To
            </h3>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "14px 16px",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{order.customer.name}</p>
              <p style={{ margin: 0, color: "#4b5563" }}>
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
              Ship From
            </h3>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "14px 16px",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>702ManyCards</p>
              <p style={{ margin: 0, color: "#4b5563" }}>Las Vegas, NV</p>
              <p style={{ margin: 0, color: "#4b5563" }}>United States</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #d1d5db",
              }}
            >
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6b7280",
                }}
              >
                Card Name
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6b7280",
                }}
              >
                Set
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6b7280",
                }}
              >
                Condition
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6b7280",
                }}
              >
                Edition
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "10px 12px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6b7280",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "10px 12px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6b7280",
                }}
              >
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                  {item.cardName}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#4b5563",
                  }}
                >
                  {item.setCode}
                </td>
                <td style={{ padding: "10px 12px", color: "#4b5563" }}>
                  {item.condition}
                </td>
                <td style={{ padding: "10px 12px", color: "#4b5563" }}>
                  {item.edition}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    fontWeight: 500,
                  }}
                >
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 40,
          }}
        >
          <div style={{ width: 260 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                fontSize: 13,
                color: "#4b5563",
              }}
            >
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                fontSize: 13,
                color: "#4b5563",
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
                  padding: "6px 0",
                  fontSize: 13,
                  color: "#059669",
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
                padding: "10px 0 0",
                marginTop: 6,
                borderTop: "2px solid #111827",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Tracking Number */}
        <div
          style={{
            marginBottom: 32,
            padding: "16px",
            border: "1px dashed #d1d5db",
            borderRadius: 6,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9ca3af",
              marginBottom: 12,
            }}
          >
            Tracking Number
          </p>
          <div
            style={{
              borderBottom: "1px solid #d1d5db",
              height: 24,
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingTop: 24,
            borderTop: "1px solid #e5e7eb",
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
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
            702ManyCards &mdash; Las Vegas, NV &mdash; www.702manycards.com
          </p>
        </div>
      </div>
    </>
  );
}
