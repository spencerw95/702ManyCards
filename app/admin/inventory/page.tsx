"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { InventoryItem, TCGGame, CardCondition } from "@/lib/types";
import { TCG_GAME_LABELS } from "@/lib/types";

const ITEMS_PER_PAGE = 50;

const GAME_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Games" },
  { value: "yugioh", label: "Yu-Gi-Oh!" },
  { value: "pokemon", label: "Pokemon" },
  { value: "mtg", label: "Magic: The Gathering" },
];

const CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Conditions" },
  { value: "Near Mint", label: "Near Mint" },
  { value: "Lightly Played", label: "Lightly Played" },
  { value: "Moderately Played", label: "Moderately Played" },
  { value: "Heavily Played", label: "Heavily Played" },
  { value: "Damaged", label: "Damaged" },
];

// Card ID map for YGOPRODeck small images
const CARD_IDS: Record<string, number> = {
  "Dark Magician": 46986414,
  "Blue-Eyes White Dragon": 89631139,
  "Exodia the Forbidden One": 33396948,
  "Left Leg of the Forbidden One": 44519536,
  "Right Leg of the Forbidden One": 8124921,
  "Left Arm of the Forbidden One": 7902349,
  "Right Arm of the Forbidden One": 70903634,
  "Gate Guardian": 25833572,
  "Jinzo": 77585513,
  "Monster Reborn": 83764718,
  "Change of Heart": 4031928,
  "Yata-Garasu": 3078576,
  "Chaos Emperor Dragon - Envoy of the End": 82301904,
  "Black Luster Soldier - Envoy of the Beginning": 72989439,
  "Red-Eyes Black Dragon": 74677422,
  "Summoned Skull": 70781052,
  "Mechanicalchaser": 7359741,
  "Pot of Greed": 55144522,
  "Dark Magician Girl": 38033121,
  "Raigeki": 12580477,
  "Mirror Force": 44095762,
  "Accesscode Talker": 86066372,
  "Rainbow Dragon": 95744531,
  "Hitotsu-Me Giant": 76184692,
  "Fissure": 66788016,
  "Effect Veiler": 97268402,
  "Mystical Space Typhoon": 5318639,
  "Torrential Tribute": 53582587,
};

function getItemImageUrl(item: InventoryItem): string | null {
  if (item.imageUrl) return item.imageUrl;
  if (item.game === "yugioh") {
    const cardId = CARD_IDS[item.cardName];
    if (cardId) return `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
  }
  return null;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const GAME_COLORS: Record<string, string> = {
  yugioh: "var(--color-primary)",
  pokemon: "#f59e0b",
  mtg: "#8b5cf6",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ price: string; quantity: string }>({ price: "", quantity: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // fail silently
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.cardName.toLowerCase().includes(search.toLowerCase()) ||
      item.setCode.toLowerCase().includes(search.toLowerCase()) ||
      item.setName.toLowerCase().includes(search.toLowerCase());
    const matchesGame = !gameFilter || item.game === gameFilter;
    const matchesCondition = !conditionFilter || item.condition === conditionFilter;
    return matchesSearch && matchesGame && matchesCondition;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ price: item.price.toString(), quantity: item.quantity.toString() });
  };

  const saveEdit = async (id: string) => {
    const price = parseFloat(editValues.price);
    const quantity = parseInt(editValues.quantity, 10);
    if (isNaN(price) || isNaN(quantity)) return;

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price, quantity }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, price, quantity } : item)));
      }
    } catch {
      // fail silently
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // fail silently
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 rounded-[var(--radius)] skeleton" />
        <div className="h-96 rounded-[var(--radius-lg)] skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-full sm:w-64"
          />
          <select
            value={gameFilter}
            onChange={(e) => { setGameFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {GAME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => { setConditionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {CONDITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <Link
          href="/admin/inventory/new"
          className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors shrink-0"
        >
          + Add Card
        </Link>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        Showing {paginated.length} of {filtered.length} items
      </p>

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Card Name</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Set</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden lg:table-cell">Game</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Condition</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden lg:table-cell">Edition</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Price</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden lg:table-cell">Cost</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden lg:table-cell">Profit</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Qty</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {paginated.map((item) => {
              const imgUrl = getItemImageUrl(item);
              const slug = item.slug || toSlug(item.cardName);
              return (
                <tr key={item.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                    <div className="flex items-center gap-2.5">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.cardName}
                          width={32}
                          height={46}
                          loading="lazy"
                          className="rounded-sm object-cover shrink-0"
                          style={{ width: 32, height: 46 }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                            const placeholder = e.currentTarget.nextElementSibling;
                            if (placeholder) (placeholder as HTMLElement).style.display = "flex";
                          }}
                        />
                      ) : null}
                      {/* Placeholder — shown if no image or on error */}
                      {!imgUrl && (
                        <div
                          className="rounded-sm shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{
                            width: 32,
                            height: 46,
                            backgroundColor: GAME_COLORS[item.game] || "var(--color-primary)",
                          }}
                        >
                          {item.cardName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Hidden placeholder for img error fallback */}
                      {imgUrl && (
                        <div
                          className="rounded-sm shrink-0 items-center justify-center text-white text-xs font-bold"
                          style={{
                            width: 32,
                            height: 46,
                            backgroundColor: GAME_COLORS[item.game] || "var(--color-primary)",
                            display: "none",
                          }}
                        >
                          {item.cardName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/cards/${slug}`}
                          className="hover:text-[var(--color-primary)] hover:underline transition-colors max-w-[180px] truncate block"
                          title={item.cardName}
                        >
                          {item.cardName}
                        </Link>
                        <div className="text-xs text-[var(--color-text-muted)] md:hidden">
                          {item.setCode} &middot; {TCG_GAME_LABELS[item.game]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell">{item.setCode}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden lg:table-cell">{TCG_GAME_LABELS[item.game]}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell">{item.condition}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden lg:table-cell">{item.edition}</td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editValues.price}
                        onChange={(e) => setEditValues((v) => ({ ...v, price: e.target.value }))}
                        className="w-20 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-[var(--color-primary)] inline-flex items-center gap-1"
                        onClick={() => startEdit(item)}
                        title="Click to edit"
                      >
                        ${item.price.toFixed(2)}
                        {item.pricingRule && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none"
                            style={{
                              backgroundColor: "var(--color-primary)",
                              color: "white",
                              opacity: 0.85,
                            }}
                            title={
                              item.pricingRule.type === "market_minus_percent"
                                ? `Auto: ${item.pricingRule.value}% below market`
                                : item.pricingRule.type === "market_minus_amount"
                                ? `Auto: $${item.pricingRule.value} below market`
                                : "Auto-priced"
                            }
                          >
                            AUTO
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden lg:table-cell">
                    {item.cost ? `$${item.cost.toFixed(2)}` : "\u2014"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {item.cost ? (
                      <span className={item.price - item.cost > 0 ? "text-[var(--color-success)] font-medium" : "text-[var(--color-danger)] font-medium"}>
                        {item.price - item.cost > 0 ? "+" : ""}${(item.price - item.cost).toFixed(2)}
                      </span>
                    ) : "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editValues.quantity}
                        onChange={(e) => setEditValues((v) => ({ ...v, quantity: e.target.value }))}
                        className="w-16 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
                      />
                    ) : (
                      <span
                        className={`cursor-pointer hover:text-[var(--color-primary)] ${item.quantity <= 2 ? "text-[var(--color-danger)] font-semibold" : "text-[var(--color-text)]"}`}
                        onClick={() => startEdit(item)}
                        title="Click to edit"
                      >
                        {item.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-success)] text-white hover:opacity-90 cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="px-2 py-1 rounded text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 cursor-pointer"
                          >
                            Edit
                          </button>
                          {deleteConfirm === item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-danger)] text-white hover:opacity-90 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(item.id)}
                              className="px-2 py-1 rounded text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-[var(--radius)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-[var(--radius)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
