"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AlertUrgency = "critical" | "warning" | "low";

interface LowStockAlertItem {
  id: string;
  name: string;
  quantity: number;
  type: "card" | "accessory";
  game?: string;
  urgency: AlertUrgency;
}

interface AlertsData {
  items: LowStockAlertItem[];
  summary: {
    critical: number;
    warning: number;
    low: number;
    total: number;
  };
}

const GAME_LABELS: Record<string, string> = {
  yugioh: "Yu-Gi-Oh!",
  pokemon: "Pokemon",
  mtg: "MTG",
};

const URGENCY_CONFIG: Record<
  AlertUrgency,
  { label: string; bg: string; border: string; dot: string; text: string }
> = {
  critical: {
    label: "Out of Stock",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "var(--color-danger)",
    dot: "var(--color-danger)",
    text: "var(--color-danger)",
  },
  warning: {
    label: "Very Low",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "var(--color-warning)",
    dot: "var(--color-warning)",
    text: "var(--color-warning)",
  },
  low: {
    label: "Low Stock",
    bg: "rgba(245, 158, 11, 0.05)",
    border: "var(--color-border)",
    dot: "#d97706",
    text: "var(--color-text-secondary)",
  },
};

export default function LowStockAlert() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/admin/alerts?threshold=5");
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json && json.summary) setData(json);
      } catch {
        // fail silently
      }
      setLoading(false);
    }
    fetchAlerts();
  }, []);

  if (loading || !data || !data.summary || data.summary.total === 0 || dismissed) {
    return null;
  }

  const { summary, items } = data;
  const hasCritical = summary.critical > 0;

  return (
    <div
      className="rounded-[var(--radius-lg)] border shadow-[var(--shadow-sm)] overflow-hidden"
      style={{
        backgroundColor: hasCritical ? "rgba(239, 68, 68, 0.06)" : "rgba(245, 158, 11, 0.06)",
        borderColor: hasCritical ? "var(--color-danger)" : "var(--color-warning)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
            style={{
              backgroundColor: hasCritical ? "var(--color-danger)" : "var(--color-warning)",
              color: "white",
            }}
          >
            {summary.total}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Low Stock Alert
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {summary.critical > 0 && (
                <span style={{ color: "var(--color-danger)" }}>
                  {summary.critical} out of stock
                </span>
              )}
              {summary.critical > 0 && (summary.warning > 0 || summary.low > 0) && " · "}
              {summary.warning > 0 && (
                <span style={{ color: "var(--color-warning)" }}>
                  {summary.warning} very low
                </span>
              )}
              {summary.warning > 0 && summary.low > 0 && " · "}
              {summary.low > 0 && (
                <span>{summary.low} low</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="p-1 rounded hover:bg-black/10 transition-colors text-[var(--color-text-muted)] cursor-pointer"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <svg
            className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded items list */}
      {expanded && (
        <div className="border-t border-[var(--color-border)]">
          <div className="divide-y divide-[var(--color-border)]">
            {items.map((item) => {
              const config = URGENCY_CONFIG[item.urgency];
              const editHref =
                item.type === "card"
                  ? "/admin/inventory"
                  : "/admin/accessories";

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="px-4 py-2.5 flex items-center gap-3"
                  style={{ backgroundColor: config.bg }}
                >
                  {/* Urgency dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: config.dot }}
                  />

                  {/* Name and metadata */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text)] truncate font-medium">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.game && (
                        <span
                          className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              item.game === "yugioh"
                                ? "var(--color-primary)"
                                : item.game === "pokemon"
                                ? "#f59e0b"
                                : "#8b5cf6",
                            color: "white",
                          }}
                        >
                          {GAME_LABELS[item.game] || item.game}
                        </span>
                      )}
                      {item.type === "accessory" && (
                        <span
                          className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "var(--color-text-muted)",
                            color: "white",
                          }}
                        >
                          Accessory
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{
                        backgroundColor: config.dot,
                        color: "white",
                      }}
                    >
                      {item.quantity === 0 ? "OUT" : `Qty: ${item.quantity}`}
                    </span>
                    <Link
                      href={editHref}
                      className="text-xs font-medium px-2 py-1 rounded hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "white",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
