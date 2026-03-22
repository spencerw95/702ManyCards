"use client";

import { useState, useMemo } from "react";

interface PriceChange {
  id: string;
  cardName: string;
  setCode: string;
  game: string;
  currentPrice: number;
  marketPrice: number;
  newPrice: number;
  changeDollar: number;
  changePercent: number;
}

interface PreviewSummary {
  totalItems: number;
  totalAffected: number;
  averageChangePercent: number;
  yugiohWithMarketData: number;
  otherGamesStoredPrice: number;
}

const GAME_OPTIONS = [
  { value: "", label: "All Games" },
  { value: "yugioh", label: "Yu-Gi-Oh!" },
  { value: "pokemon", label: "Pokemon" },
  { value: "mtg", label: "Magic: The Gathering" },
];

const GAME_LABELS: Record<string, string> = {
  yugioh: "Yu-Gi-Oh!",
  pokemon: "Pokemon",
  mtg: "MTG",
};

type SortKey = "cardName" | "currentPrice" | "marketPrice" | "newPrice" | "changeDollar" | "changePercent";
type SortDir = "asc" | "desc";

export default function PricingPage() {
  // Rule state
  const [ruleType, setRuleType] = useState<"percentage" | "fixed">("percentage");
  const [direction, setDirection] = useState<"below" | "above">("below");
  const [ruleValue, setRuleValue] = useState("10");
  const [minPrice, setMinPrice] = useState("0.50");
  const [maxDiscount, setMaxDiscount] = useState("40");
  const [gameFilter, setGameFilter] = useState("");

  // Preview state
  const [changes, setChanges] = useState<PriceChange[]>([]);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("changeDollar");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Apply state
  const [showConfirm, setShowConfirm] = useState(false);
  const [applyMode, setApplyMode] = useState<"all" | "selected">("all");
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ updatedCount: number; averageChangePercent: number } | null>(null);

  const buildPayload = (action: "preview" | "apply", ids?: string[] | null) => ({
    action,
    rule: ruleType,
    value: parseFloat(ruleValue) || 0,
    direction,
    minPrice: parseFloat(minPrice) || 0,
    maxDiscount: parseFloat(maxDiscount) || 0,
    game: gameFilter || null,
    selectedIds: ids || null,
  });

  const handlePreview = async () => {
    setLoading(true);
    setProgress("Fetching inventory and market prices...");
    setChanges([]);
    setSummary(null);
    setResult(null);
    setSelectedIds(new Set());

    try {
      const res = await fetch("/api/admin/bulk-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("preview")),
      });

      const data = await res.json();
      if (data.success) {
        setChanges(data.changes);
        setSummary(data.summary);
        setProgress("");
      } else {
        setProgress(`Error: ${data.error}`);
      }
    } catch {
      setProgress("Failed to fetch preview. Please try again.");
    }
    setLoading(false);
  };

  const handleApply = async () => {
    setApplying(true);
    setShowConfirm(false);

    const ids = applyMode === "selected" ? Array.from(selectedIds) : null;

    try {
      const res = await fetch("/api/admin/bulk-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("apply", ids)),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.summary);
        // Clear the preview
        setChanges([]);
        setSummary(null);
      }
    } catch {
      // fail silently
    }
    setApplying(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === changes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(changes.map((c) => c.id)));
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "cardName" ? "asc" : "desc");
    }
  };

  const sortedChanges = useMemo(() => {
    const sorted = [...changes].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const numA = aVal as number;
      const numB = bVal as number;
      return sortDir === "asc" ? numA - numB : numB - numA;
    });
    return sorted;
  }, [changes, sortKey, sortDir]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="text-[var(--color-text-muted)] ml-1 opacity-40">&#x25B4;&#x25BE;</span>;
    return <span className="ml-1">{sortDir === "asc" ? "\u25B4" : "\u25BE"}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Pricing Rules Section */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Pricing Rules</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Set a bulk pricing rule based on TCGPlayer market data. Yu-Gi-Oh cards use live market prices; Pokemon and MTG use stored prices.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Price Direction
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "below" | "above")}
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            >
              <option value="below">Below Market Price (Undercut)</option>
              <option value="above">Above Market Price (Markup)</option>
            </select>
          </div>

          {/* Rule Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Adjustment Type
            </label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as "percentage" | "fixed")}
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              {ruleType === "percentage" ? "Percentage" : "Dollar Amount"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">
                {ruleType === "percentage" ? "%" : "$"}
              </span>
              <input
                type="number"
                step={ruleType === "percentage" ? "1" : "0.25"}
                min="0"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </div>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Minimum Price Floor
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">$</span>
              <input
                type="number"
                step="0.05"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Never price below this amount</p>
          </div>

          {/* Max Discount */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Maximum Discount Cap
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">%</span>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Never discount more than this % below market</p>
          </div>

          {/* Game Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Game Filter
            </label>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            >
              {GAME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {gameFilter && gameFilter !== "yugioh" && (
              <p className="text-xs text-[var(--color-warning)] mt-1">
                No live market API for {GAME_LABELS[gameFilter]}. Will use stored prices.
              </p>
            )}
          </div>
        </div>

        {/* Rule Summary */}
        <div className="mt-5 p-3 rounded-[var(--radius)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text)]">
            <span className="font-medium">Rule:</span>{" "}
            TCGPlayer market price{" "}
            <span className={direction === "below" ? "text-[var(--color-success)] font-semibold" : "text-[var(--color-danger)] font-semibold"}>
              {direction === "below" ? "minus" : "plus"}{" "}
              {ruleType === "percentage" ? `${ruleValue}%` : `$${ruleValue}`}
            </span>
            {" | "}
            Floor: <span className="font-semibold">${minPrice}</span>
            {" | "}
            Max discount: <span className="font-semibold">{maxDiscount}%</span>
            {gameFilter && (
              <>
                {" | "}
                Game: <span className="font-semibold">{GAME_LABELS[gameFilter] || gameFilter}</span>
              </>
            )}
          </p>
        </div>

        {/* Preview Button */}
        <div className="mt-5">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-6 py-2.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Fetching Prices..." : "Preview Changes"}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">{progress}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                This may take a few seconds while we fetch market prices from YGOPRODeck...
              </p>
            </div>
          </div>
          {/* Progress bar animation */}
          <div className="mt-3 h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-primary)] rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Result Banner */}
      {result && (
        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-[var(--radius-lg)] p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--color-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-[var(--color-success)]">
              Updated {result.updatedCount} cards. Average price change: {result.averageChangePercent > 0 ? "+" : ""}{result.averageChangePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {summary && changes.length > 0 && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          {/* Summary Header */}
          <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Preview</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {summary.totalItems} cards found
                {" \u00B7 "}
                {summary.totalAffected} prices would change
                {" \u00B7 "}
                Avg change: <span className={summary.averageChangePercent < 0 ? "text-[var(--color-success)] font-medium" : "text-[var(--color-danger)] font-medium"}>
                  {summary.averageChangePercent > 0 ? "+" : ""}{summary.averageChangePercent.toFixed(1)}%
                </span>
                {summary.otherGamesStoredPrice > 0 && (
                  <span className="text-[var(--color-warning)]">
                    {" \u00B7 "}{summary.otherGamesStoredPrice} cards using stored prices (no live data)
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setApplyMode("selected"); setShowConfirm(true); }}
                disabled={selectedIds.size === 0 || applying}
                className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-primary)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Apply to Selected ({selectedIds.size})
              </button>
              <button
                onClick={() => { setApplyMode("all"); setShowConfirm(true); }}
                disabled={applying}
                className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {applying ? "Applying..." : "Apply to All"}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <th className="text-left px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === changes.length && changes.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--color-border)] cursor-pointer"
                    />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none"
                    onClick={() => handleSort("cardName")}
                  >
                    Card Name <SortIcon column="cardName" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">
                    Game
                  </th>
                  <th
                    className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none"
                    onClick={() => handleSort("currentPrice")}
                  >
                    Current <SortIcon column="currentPrice" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none hidden sm:table-cell"
                    onClick={() => handleSort("marketPrice")}
                  >
                    Market <SortIcon column="marketPrice" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none"
                    onClick={() => handleSort("newPrice")}
                  >
                    New Price <SortIcon column="newPrice" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none hidden sm:table-cell"
                    onClick={() => handleSort("changeDollar")}
                  >
                    Change ($) <SortIcon column="changeDollar" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none"
                    onClick={() => handleSort("changePercent")}
                  >
                    Change (%) <SortIcon column="changePercent" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {sortedChanges.map((change) => {
                  const isDecrease = change.changeDollar < 0;
                  const isIncrease = change.changeDollar > 0;
                  const changeColor = isDecrease
                    ? "text-[var(--color-success)]"
                    : isIncrease
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-text-muted)]";

                  return (
                    <tr key={change.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(change.id)}
                          onChange={() => toggleSelect(change.id)}
                          className="rounded border-[var(--color-border)] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--color-text)]">{change.cardName}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{change.setCode}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell">
                        {GAME_LABELS[change.game] || change.game}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text)]">
                        ${change.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] hidden sm:table-cell">
                        ${change.marketPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">
                        ${change.newPrice.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${changeColor}`}>
                        {change.changeDollar > 0 ? "+" : ""}
                        {change.changeDollar === 0 ? "--" : `$${change.changeDollar.toFixed(2)}`}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${changeColor}`}>
                        {change.changePercent > 0 ? "+" : ""}
                        {change.changePercent === 0 ? "--" : `${change.changePercent.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state after preview with no results */}
      {!loading && summary && changes.length === 0 && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No items found matching the selected filters.</p>
        </div>
      )}

      {/* Error state */}
      {!loading && progress && !summary && (
        <div className="bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-lg)] p-4">
          <p className="text-sm text-[var(--color-danger)]">{progress}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">Confirm Bulk Price Update</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {applyMode === "all"
                ? `This will update prices for all ${changes.length} cards in the preview.`
                : `This will update prices for ${selectedIds.size} selected cards.`}
            </p>
            <div className="p-3 rounded-[var(--radius)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
              <p className="text-sm text-[var(--color-text)]">
                <span className="font-medium">Rule:</span>{" "}
                Market price {direction === "below" ? "minus" : "plus"}{" "}
                {ruleType === "percentage" ? `${ruleValue}%` : `$${ruleValue}`}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Floor: ${minPrice} | Max discount: {maxDiscount}%
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
