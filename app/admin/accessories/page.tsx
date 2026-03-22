"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import ImageUpload from "@/components/ImageUpload";
import type { AccessoryItem, AccessoryCategory, AccessoryGame } from "@/lib/types";
import {
  ACCESSORY_CATEGORY_LABELS,
  ACCESSORY_CATEGORY_LIST,
  ACCESSORY_GAME_LABELS,
  ACCESSORY_GAME_LIST,
  ACCESSORY_CATEGORIES,
  SEALED_CATEGORIES,
} from "@/lib/types";

type FilterTab = "all" | "accessories" | "sealed";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "card-sleeves" as AccessoryCategory,
  subcategory: "",
  brand: "",
  price: "",
  cost: "",
  quantity: "1",
  imageUrl: "",
  color: "",
  game: "" as AccessoryGame | "",
  setName: "",
};

function categoryGradient(category: AccessoryCategory): string {
  switch (category) {
    case "playmat":
      return "bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900";
    case "deck-box":
      return "bg-gradient-to-br from-sky-900 via-blue-800 to-cyan-900";
    case "card-sleeves":
      return "bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900";
    case "booster-box":
      return "bg-gradient-to-br from-orange-900 via-orange-800 to-red-900";
    case "starter-deck":
      return "bg-gradient-to-br from-yellow-900 via-amber-800 to-amber-900";
    case "tin-bundle":
      return "bg-gradient-to-br from-pink-900 via-rose-800 to-rose-900";
    case "other":
      return "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800";
  }
}

export default function AccessoriesPage() {
  const [items, setItems] = useState<AccessoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/accessories");
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

  const filteredItems = items.filter((item) => {
    // Tab filter
    if (filterTab === "accessories" && !ACCESSORY_CATEGORIES.includes(item.category)) return false;
    if (filterTab === "sealed" && !SEALED_CATEGORIES.includes(item.category)) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.setName && item.setName.toLowerCase().includes(q)) ||
        (item.game && item.game.toLowerCase().includes(q)) ||
        ACCESSORY_CATEGORY_LABELS[item.category].toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  };

  const openEdit = (item: AccessoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory || "",
      brand: item.brand || "",
      price: item.price.toString(),
      cost: item.cost != null ? item.cost.toString() : "",
      quantity: item.quantity.toString(),
      imageUrl: item.imageUrl || "",
      color: item.color || "",
      game: item.game || "",
      setName: item.setName || "",
    });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory || undefined,
      brand: form.brand || undefined,
      price: parseFloat(form.price),
      cost: form.cost ? parseFloat(form.cost) : undefined,
      quantity: parseInt(form.quantity, 10),
      imageUrl: form.imageUrl || undefined,
      color: form.color || undefined,
      game: form.game || undefined,
      setName: form.setName || undefined,
    };

    try {
      if (editingItem) {
        const res = await fetch("/api/admin/accessories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
        const data = await res.json();
        if (data.success) {
          setItems((prev) => prev.map((item) => (item.id === editingItem.id ? data.item : item)));
          setShowForm(false);
        } else {
          setError(data.error || "Failed to update");
        }
      } else {
        const res = await fetch("/api/admin/accessories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setItems((prev) => [...prev, data.item]);
          setShowForm(false);
        } else {
          setError(data.error || "Failed to add");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/accessories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // fail silently
    }
    setDeleteConfirm(null);
  };

  const inputClasses =
    "w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors";

  const accessoryCount = items.filter((i) => ACCESSORY_CATEGORIES.includes(i.category)).length;
  const sealedCount = items.filter((i) => SEALED_CATEGORIES.includes(i.category)).length;

  if (loading) {
    return <div className="h-96 rounded-[var(--radius-lg)] skeleton" />;
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[var(--color-text-muted)]">
          {items.length} total &middot; {accessoryCount} accessories &middot; {sealedCount} sealed products
        </p>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
        >
          + Add Product
        </button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1">
          {([
            { value: "all" as FilterTab, label: "All" },
            { value: "accessories" as FilterTab, label: "Accessories" },
            { value: "sealed" as FilterTab, label: "Sealed Products" },
          ]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterTab(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border transition-colors cursor-pointer ${
                filterTab === tab.value
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              {editingItem ? "Edit Product" : "Add Product"}
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Category + Game */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AccessoryCategory }))}
                    className={inputClasses}
                  >
                    <optgroup label="Accessories">
                      {ACCESSORY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{ACCESSORY_CATEGORY_LABELS[c]}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Sealed Products">
                      {SEALED_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{ACCESSORY_CATEGORY_LABELS[c]}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Other">
                      <option value="other">Other</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Game</label>
                  <select
                    value={form.game}
                    onChange={(e) => setForm((f) => ({ ...f, game: e.target.value as AccessoryGame | "" }))}
                    className={inputClasses}
                  >
                    <option value="">-- None --</option>
                    {ACCESSORY_GAME_LIST.map((g) => (
                      <option key={g} value={g}>{ACCESSORY_GAME_LABELS[g]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Product Image</label>
                <ImageUpload
                  currentUrl={form.imageUrl || undefined}
                  folder="accessories"
                  onUpload={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  onRemove={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                />
              </div>

              {/* Row 2: Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={inputClasses}
                  placeholder="e.g. Phantom Nightmare Booster Box"
                />
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className={inputClasses}
                  placeholder="Brief description..."
                />
              </div>

              {/* Row 4: Set Name + Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Set Name</label>
                  <input
                    type="text"
                    value={form.setName}
                    onChange={(e) => setForm((f) => ({ ...f, setName: e.target.value }))}
                    className={inputClasses}
                    placeholder="e.g. Phantom Nightmare"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    className={inputClasses}
                    placeholder="e.g. Konami, Dragon Shield"
                  />
                </div>
              </div>

              {/* Row 5: Selling Price + Cost + Quantity */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Cost Paid ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    required
                    className={inputClasses}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Row 6: Color + Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Color</label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className={inputClasses}
                    placeholder="e.g. Black, Red/Blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Subcategory</label>
                  <input
                    type="text"
                    value={form.subcategory}
                    onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                    className={inputClasses}
                    placeholder="e.g. japanese-size, standard-size"
                  />
                </div>
              </div>


              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-[var(--radius)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? "Saving..." : editingItem ? "Update" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)] w-10"></th>
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)]">Name</th>
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Category</th>
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)] hidden lg:table-cell">Game</th>
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)] hidden lg:table-cell">Brand</th>
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)]">Price</th>
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)] hidden xl:table-cell">Cost</th>
              <th className="text-left px-3 py-3 font-semibold text-[var(--color-text-secondary)]">Qty</th>
              <th className="text-right px-3 py-3 font-semibold text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                {/* Thumbnail */}
                <td className="px-3 py-2">
                  <div className={`w-9 h-9 rounded-[var(--radius)] overflow-hidden flex-shrink-0 ${!item.imageUrl ? categoryGradient(item.category) : ""}`}>
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                </td>
                {/* Name */}
                <td className="px-3 py-2 font-medium text-[var(--color-text)]">
                  <div className="max-w-[200px] truncate">{item.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] md:hidden">
                    {ACCESSORY_CATEGORY_LABELS[item.category]}
                  </div>
                  {item.setName && (
                    <div className="text-[10px] text-[var(--color-text-muted)]">{item.setName}</div>
                  )}
                </td>
                {/* Category */}
                <td className="px-3 py-2 text-[var(--color-text-secondary)] hidden md:table-cell">
                  <span className="text-xs">{ACCESSORY_CATEGORY_LABELS[item.category]}</span>
                </td>
                {/* Game */}
                <td className="px-3 py-2 text-[var(--color-text-secondary)] hidden lg:table-cell">
                  <span className="text-xs">{item.game ? ACCESSORY_GAME_LABELS[item.game] : "-"}</span>
                </td>
                {/* Brand */}
                <td className="px-3 py-2 text-[var(--color-text-secondary)] hidden lg:table-cell text-xs">
                  {item.brand || "-"}
                </td>
                {/* Price */}
                <td className="px-3 py-2 text-[var(--color-text)]">${item.price.toFixed(2)}</td>
                {/* Cost */}
                <td className="px-3 py-2 text-[var(--color-text-secondary)] hidden xl:table-cell text-xs">
                  {item.cost != null ? `$${item.cost.toFixed(2)}` : "-"}
                </td>
                {/* Qty */}
                <td className={`px-3 py-2 ${item.quantity <= 2 ? "text-[var(--color-danger)] font-semibold" : "text-[var(--color-text)]"}`}>
                  {item.quantity}
                </td>
                {/* Actions */}
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(item)}
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
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  {items.length === 0
                    ? 'No products yet. Click "Add Product" to get started.'
                    : "No products match your current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
