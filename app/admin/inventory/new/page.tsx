"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type {
  TCGGame,
  CardCondition,
  CardEdition,
  UnifiedCardResult,
  UnifiedCardPrinting,
  PricingRule,
} from "@/lib/types";

const CONDITION_OPTIONS: CardCondition[] = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];

const EDITION_OPTIONS: CardEdition[] = ["1st Edition", "Unlimited", "Limited Edition"];

const GAME_OPTIONS: { value: TCGGame; label: string }[] = [
  { value: "yugioh", label: "Yu-Gi-Oh!" },
  { value: "pokemon", label: "Pokemon" },
  { value: "mtg", label: "MTG" },
];

type Step = "search" | "details" | "success";

export default function AddCardPage() {
  // --- Step state ---
  const [step, setStep] = useState<Step>("search");

  // --- Game selector ---
  const [selectedGame, setSelectedGame] = useState<TCGGame>("yugioh");

  // --- Search state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UnifiedCardResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Selected card state ---
  const [selectedCard, setSelectedCard] = useState<UnifiedCardResult | null>(null);
  const [selectedPrinting, setSelectedPrinting] = useState<UnifiedCardPrinting | null>(null);

  // --- Form state ---
  const [condition, setCondition] = useState<CardCondition>("Near Mint");
  const [edition, setEdition] = useState<CardEdition>("1st Edition");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-pricing state
  const [autoPrice, setAutoPrice] = useState(false);
  const [autoPriceType, setAutoPriceType] = useState<"market_minus_percent" | "market_minus_amount">("market_minus_percent");
  const [autoPriceValue, setAutoPriceValue] = useState("10");
  const [autoPriceMin, setAutoPriceMin] = useState("");

  // --- Search with debounce ---
  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/admin/card-search?q=${encodeURIComponent(q)}&game=${selectedGame}`
        );
        const data = await res.json();
        setSearchResults(data.data || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      }
      setSearchLoading(false);
    },
    [selectedGame]
  );

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // --- Switch game: clear search state ---
  const handleGameSwitch = (game: TCGGame) => {
    setSelectedGame(game);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedCard(null);
    setSelectedPrinting(null);
    setError("");
    // Default edition for non-yugioh games
    if (game !== "yugioh") {
      setEdition("Unlimited");
    } else {
      setEdition("1st Edition");
    }
  };

  // --- Select a card ---
  const handleSelectCard = (card: UnifiedCardResult) => {
    setSelectedCard(card);
    setShowDropdown(false);
    setSearchQuery(card.name);

    // Auto-fill image
    if (card.imageLarge) setImageUrl(card.imageLarge);

    // Auto-select first printing
    if (card.printings && card.printings.length > 0) {
      setSelectedPrinting(card.printings[0]);
    } else {
      setSelectedPrinting(null);
    }

    // For non-yugioh, default to Unlimited edition
    if (card.game !== "yugioh") {
      setEdition("Unlimited");
    }

    setStep("details");
  };

  // --- Select a printing ---
  const handleSelectPrinting = (printing: UnifiedCardPrinting) => {
    setSelectedPrinting(printing);
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!selectedCard) return;
    setError("");
    setSubmitting(true);

    const cardName = selectedCard.name;
    const setCode = selectedPrinting?.setCode || "";
    const setName = selectedPrinting?.setName || "";
    const rarity = selectedPrinting?.rarity || "";

    // Build pricing rule if auto-price is enabled
    let pricingRule: PricingRule | undefined;
    if (autoPrice) {
      pricingRule = {
        type: autoPriceType,
        value: parseFloat(autoPriceValue) || 0,
        minPrice: autoPriceMin ? parseFloat(autoPriceMin) : undefined,
      };
    }

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName,
          setCode,
          setName,
          rarity,
          edition,
          condition,
          price: parseFloat(price),
          cost: cost ? parseFloat(cost) : undefined,
          quantity: parseInt(quantity, 10),
          language: "English",
          game: selectedGame,
          imageUrl: imageUrl || undefined,
          pricingRule,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep("success");
      } else {
        setError(data.error || "Failed to add card");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Reset to search ---
  const resetToSearch = () => {
    setStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCard(null);
    setSelectedPrinting(null);
    setCondition("Near Mint");
    setEdition(selectedGame === "yugioh" ? "1st Edition" : "Unlimited");
    setPrice("");
    setCost("");
    setQuantity("1");
    setImageUrl("");
    setError("");
    setAutoPrice(false);
    setAutoPriceValue("10");
    setAutoPriceMin("");
  };

  const inputClasses =
    "w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors";
  const labelClasses = "block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5";

  // Helper: does this game have multiple printings per card?
  const hasMultiplePrintings = selectedCard && selectedCard.game === "yugioh" && selectedCard.printings.length > 1;

  // Helper: search placeholder per game
  const searchPlaceholder: Record<TCGGame, string> = {
    yugioh: "Start typing a card name (e.g. Dark Magician, Blue-Eyes)...",
    pokemon: "Start typing a card name (e.g. Charizard, Pikachu)...",
    mtg: "Start typing a card name (e.g. Lightning Bolt, Black Lotus)...",
  };

  // Helper: search hint per game
  const searchHint: Record<TCGGame, string> = {
    yugioh: "Searches the YGOPRODeck database. Type at least 2 characters.",
    pokemon: "Searches the Pokemon TCG API. Type at least 2 characters.",
    mtg: "Searches Scryfall. Type at least 2 characters.",
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Link href="/admin/inventory" className="text-sm text-[var(--color-primary)] hover:underline">
          &larr; Back to Inventory
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {["Search", "Details", "Done"].map((label, i) => {
          const stepMap: Step[] = ["search", "details", "success"];
          const currentIdx = stepMap.indexOf(step);
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className="w-8 h-0.5"
                  style={{
                    backgroundColor: isDone ? "var(--color-primary)" : "var(--color-border)",
                  }}
                />
              )}
              <div
                className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full transition-colors"
                style={{
                  backgroundColor: isActive
                    ? "var(--color-primary)"
                    : isDone
                    ? "var(--color-primary)"
                    : "var(--color-bg-secondary)",
                  color: isActive || isDone ? "white" : "var(--color-text-muted)",
                  opacity: isActive || isDone ? 1 : 0.6,
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: isActive || isDone ? "rgba(255,255,255,0.2)" : "var(--color-border)",
                    color: isActive || isDone ? "white" : "var(--color-text-muted)",
                  }}
                >
                  {isDone ? "\u2713" : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
          {error}
        </div>
      )}

      {/* ===== STEP 1: Search ===== */}
      {step === "search" && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          {/* Game selector */}
          <div className="mb-5">
            <label className={labelClasses}>Game</label>
            <div className="flex rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden">
              {GAME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleGameSwitch(opt.value)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    selectedGame === opt.value
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Search for a Card</h2>
          <div ref={searchRef} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder={searchPlaceholder[selectedGame]}
              className={inputClasses + " text-base !py-3.5"}
              autoFocus
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Dropdown results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg max-h-[400px] overflow-y-auto">
                {searchResults.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-secondary)] transition-colors text-left cursor-pointer border-b border-[var(--color-border)] last:border-b-0"
                    onClick={() => handleSelectCard(card)}
                  >
                    {card.imageSmall ? (
                      <img
                        src={card.imageSmall}
                        alt={card.name}
                        width={34}
                        height={50}
                        loading="lazy"
                        className="rounded-sm object-cover shrink-0"
                        style={{ width: 34, height: 50 }}
                      />
                    ) : (
                      <div
                        className="rounded-sm shrink-0 flex items-center justify-center bg-[var(--color-primary)] text-white text-xs font-bold"
                        style={{ width: 34, height: 50 }}
                      >
                        ?
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[var(--color-text)] text-sm truncate">{card.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] truncate">{card.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && !searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg p-4 text-center text-sm text-[var(--color-text-muted)]">
                No cards found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            {searchHint[selectedGame]}
          </p>
        </div>
      )}

      {/* ===== STEP 2: Details ===== */}
      {step === "details" && selectedCard && (
        <div className="space-y-4">
          {/* Card preview */}
          <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Card image */}
              <div className="shrink-0 self-center sm:self-start">
                {selectedCard.imageLarge ? (
                  <img
                    src={selectedCard.imageLarge}
                    alt={selectedCard.name}
                    width={180}
                    height={263}
                    loading="lazy"
                    className="rounded-lg shadow-md"
                    style={{ width: 180, height: "auto" }}
                  />
                ) : (
                  <div
                    className="rounded-lg flex items-center justify-center bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]"
                    style={{ width: 180, height: 263 }}
                  >
                    No Image
                  </div>
                )}
              </div>

              {/* Card info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">{selectedCard.name}</h2>
                <div className="text-sm text-[var(--color-text-secondary)] mb-3">{selectedCard.type}</div>

                {selectedCard.description && (
                  <div className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed max-h-[120px] overflow-y-auto">
                    {selectedCard.description}
                  </div>
                )}

                {/* Stats */}
                {selectedCard.stats && Object.keys(selectedCard.stats).length > 0 && (
                  <div className="flex flex-wrap gap-3 text-xs">
                    {Object.entries(selectedCard.stats).map(([key, val]) => (
                      <span
                        key={key}
                        className="px-2 py-1 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                      >
                        {key} {val}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={resetToSearch}
                  className="mt-4 text-sm text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  &larr; Search for a different card
                </button>
              </div>
            </div>
          </div>

          {/* Printing selector — only for Yu-Gi-Oh with multiple printings */}
          {hasMultiplePrintings && (
            <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
              <label className={labelClasses}>Select Printing / Set</label>
              <div className="max-h-[200px] overflow-y-auto border border-[var(--color-border)] rounded-[var(--radius)] divide-y divide-[var(--color-border)]">
                {selectedCard.printings.map((p, idx) => {
                  const isSelected =
                    selectedPrinting?.setCode === p.setCode &&
                    selectedPrinting?.setName === p.setName &&
                    selectedPrinting?.rarity === p.rarity;
                  return (
                    <button
                      key={`${p.setCode}-${idx}`}
                      type="button"
                      onClick={() => handleSelectPrinting(p)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[var(--color-primary)]/10"
                          : "hover:bg-[var(--color-bg-secondary)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[var(--color-text)] truncate">{p.setName}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {p.setCode} &middot; {p.rarity}
                        </div>
                      </div>
                      {p.price && (
                        <div className="text-sm text-[var(--color-text-secondary)] shrink-0">${p.price}</div>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <span className="text-white text-xs">{"\u2713"}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedPrinting && (
                <div className="mt-3 text-sm text-[var(--color-text-muted)]">
                  Selected:{" "}
                  <span className="font-medium text-[var(--color-text)]">{selectedPrinting.setCode}</span>{" "}
                  &middot; {selectedPrinting.setName} &middot; {selectedPrinting.rarity}
                </div>
              )}
            </div>
          )}

          {/* Read-only printing info for Pokemon / MTG (single printing per result) */}
          {!hasMultiplePrintings && selectedPrinting && (
            <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
              <label className={labelClasses}>Set / Printing Info</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-[var(--color-text-muted)] text-xs block">Set</span>
                  <span className="text-[var(--color-text)] font-medium">{selectedPrinting.setName}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-xs block">Code</span>
                  <span className="text-[var(--color-text)] font-medium">{selectedPrinting.setCode}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-xs block">Rarity</span>
                  <span className="text-[var(--color-text)] font-medium">{selectedPrinting.rarity}</span>
                </div>
                {selectedPrinting.number && (
                  <div>
                    <span className="text-[var(--color-text-muted)] text-xs block">Number</span>
                    <span className="text-[var(--color-text)] font-medium">{selectedPrinting.number}</span>
                  </div>
                )}
                {selectedPrinting.price && (
                  <div>
                    <span className="text-[var(--color-text-muted)] text-xs block">Market Price</span>
                    <span className="text-[var(--color-text)] font-medium">${selectedPrinting.price}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Condition / Edition / Price form */}
          <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6 space-y-5">
            <h3 className="text-base font-semibold text-[var(--color-text)]">Inventory Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as CardCondition)}
                  className={inputClasses}
                >
                  {CONDITION_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {selectedGame === "yugioh" ? (
                <div>
                  <label className={labelClasses}>Edition</label>
                  <select
                    value={edition}
                    onChange={(e) => setEdition(e.target.value as CardEdition)}
                    className={inputClasses}
                  >
                    {EDITION_OPTIONS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={labelClasses}>Edition</label>
                  <input
                    type="text"
                    value="Unlimited"
                    disabled
                    className={inputClasses + " opacity-60 cursor-not-allowed"}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClasses}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>Cost Paid ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className={inputClasses}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelClasses}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClasses}
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Image URL (auto-filled)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClasses}
                placeholder="https://..."
              />
            </div>

            {/* Auto-pricing toggle */}
            <div className="border border-[var(--color-border)] rounded-[var(--radius)] p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrice}
                  onChange={(e) => setAutoPrice(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                />
                <span className="text-sm font-medium text-[var(--color-text)]">
                  Auto-price from market data
                </span>
              </label>

              {autoPrice && (
                <div className="space-y-3 pl-6">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Price will be calculated from live market data on the card detail page. The &ldquo;Selling Price&rdquo; above is used as a fallback if market data is unavailable.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClasses}>Discount Type</label>
                      <select
                        value={autoPriceType}
                        onChange={(e) => setAutoPriceType(e.target.value as "market_minus_percent" | "market_minus_amount")}
                        className={inputClasses}
                      >
                        <option value="market_minus_percent">% Off Market</option>
                        <option value="market_minus_amount">$ Off Market</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>
                        {autoPriceType === "market_minus_percent" ? "Percentage (%)" : "Amount ($)"}
                      </label>
                      <input
                        type="number"
                        step={autoPriceType === "market_minus_percent" ? "1" : "0.01"}
                        min="0"
                        value={autoPriceValue}
                        onChange={(e) => setAutoPriceValue(e.target.value)}
                        className={inputClasses}
                        placeholder={autoPriceType === "market_minus_percent" ? "10" : "5.00"}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Min Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={autoPriceMin}
                        onChange={(e) => setAutoPriceMin(e.target.value)}
                        className={inputClasses}
                        placeholder="0.50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !price || !quantity}
              className="w-full py-2.5 px-4 rounded-[var(--radius)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "Adding Card..." : "Add to Inventory"}
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: Success ===== */}
      {step === "success" && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-[var(--color-success)]">{"\u2713"}</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Card Added Successfully!</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            {selectedCard?.name} has been added to your inventory.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={resetToSearch}
              className="px-6 py-2.5 rounded-[var(--radius)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Add Another Card
            </button>
            <Link
              href="/admin/inventory"
              className="px-6 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors text-center"
            >
              Back to Inventory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
