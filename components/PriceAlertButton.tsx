"use client";

import { useState, useEffect, useRef } from "react";

interface PriceAlertButtonProps {
  cardName: string;
  slug: string;
  currentPrice: number;
  imageUrl: string;
}

interface PriceAlert {
  id: string;
  card_name: string;
  slug: string;
  target_price: number;
  current_price: number | null;
  notified: boolean;
}

export default function PriceAlertButton({
  cardName,
  slug,
  currentPrice,
  imageUrl,
}: PriceAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alert, setAlert] = useState<PriceAlert | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Suggested price: 10% below current
  const suggestedPrice = Math.max(0.01, currentPrice * 0.9);

  // Fetch existing alert for this card
  useEffect(() => {
    setLoading(true);
    fetch("/api/customer/price-alerts")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.alerts) {
          const existing = data.alerts.find(
            (a: PriceAlert) => a.slug === slug && !a.notified
          );
          if (existing) {
            setAlert(existing);
            setTargetPrice(existing.target_price.toString());
          } else {
            setTargetPrice(suggestedPrice.toFixed(2));
          }
        } else {
          // Not logged in or error — set default
          setTargetPrice(suggestedPrice.toFixed(2));
        }
      })
      .catch(() => {
        setTargetPrice(suggestedPrice.toFixed(2));
      })
      .finally(() => setLoading(false));
  }, [slug, suggestedPrice]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setError("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleSave = async () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError("Enter a valid price");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/customer/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_name: cardName,
          slug,
          target_price: price,
          current_price: currentPrice,
          image_url: imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setError("Sign in to set price alerts");
        } else {
          setError(data.error || "Failed to save alert");
        }
        return;
      }

      setAlert(data.alert);
      setIsOpen(false);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!alert) return;
    setSaving(true);

    try {
      const res = await fetch(
        `/api/customer/price-alerts?id=${encodeURIComponent(alert.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (data.success) {
        setAlert(null);
        setTargetPrice(suggestedPrice.toFixed(2));
        setIsOpen(false);
      }
    } catch {
      setError("Failed to remove alert");
    } finally {
      setSaving(false);
    }
  };

  const hasAlert = !!alert;

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        title={hasAlert ? `Alert set at $${alert.target_price}` : "Set price drop alert"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          borderRadius: "8px",
          border: hasAlert
            ? "1.5px solid var(--color-success, #22c55e)"
            : "1.5px solid var(--color-border, #333)",
          background: hasAlert
            ? "rgba(34,197,94,0.1)"
            : "var(--color-bg-card, #1a1a2e)",
          color: hasAlert
            ? "var(--color-success, #22c55e)"
            : "var(--color-text-muted, #999)",
          cursor: loading ? "wait" : "pointer",
          fontSize: "13px",
          fontWeight: 500,
          transition: "all 0.2s ease",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={hasAlert ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasAlert ? "Alert Set" : "Price Alert"}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 50,
            width: "280px",
            background: "var(--color-bg-card, #1a1a2e)",
            border: "1px solid var(--color-border, #333)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text, #fff)",
              marginBottom: "4px",
            }}
          >
            Price Drop Alert
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted, #999)",
              marginBottom: "12px",
            }}
          >
            {hasAlert
              ? `Watching for price below $${Number(alert.target_price).toFixed(2)}`
              : "Get notified when the price drops below your target"}
          </div>

          {/* Current price display */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "var(--color-text-muted, #999)" }}>Current price</span>
            <span
              style={{
                color: "var(--color-primary, #f59e0b)",
                fontWeight: 600,
              }}
            >
              ${currentPrice.toFixed(2)}
            </span>
          </div>

          {/* Target price input */}
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--color-text-muted, #999)",
                marginBottom: "4px",
              }}
            >
              Notify me below
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--color-border, #333)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  padding: "8px 10px",
                  background: "var(--color-bg-secondary, #111)",
                  color: "var(--color-text-muted, #999)",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRight: "1px solid var(--color-border, #333)",
                }}
              >
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text, #fff)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
                placeholder={suggestedPrice.toFixed(2)}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-danger, #ef4444)",
                marginBottom: "8px",
              }}
            >
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: "var(--color-primary, #f59e0b)",
                color: "#000",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : hasAlert ? "Update Alert" : "Set Alert"}
            </button>
            {hasAlert && (
              <button
                onClick={handleRemove}
                disabled={saving}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-danger, #ef4444)",
                  background: "transparent",
                  color: "var(--color-danger, #ef4444)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
