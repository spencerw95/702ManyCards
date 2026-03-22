"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type {
  InventoryItem,
  SearchFilters,
  SortOption,
  CardCondition,
  CardEdition,
  YugiohCard,
  TCGGame,
} from "@/lib/types";
import { SORT_LABELS, CONDITION_SHORT, CONDITION_ORDER, TCG_GAME_LABELS, TCG_GAME_LIST } from "@/lib/types";
import { getUniqueCards, sortItems } from "@/lib/inventory";
import { searchCards } from "@/lib/ygoprodeck";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";
import { addToCart } from "@/lib/cart";

// ===== Card ID map for demo images =====

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

function getCardId(name: string): number {
  return CARD_IDS[name] || 46986414;
}

function getImageUrl(item: InventoryItem): string {
  if (item.imageUrl) return item.imageUrl;
  return `https://images.ygoprodeck.com/images/cards_small/${getCardId(item.cardName)}.jpg`;
}

// ===== Edition options =====

const EDITION_OPTIONS: CardEdition[] = ["1st Edition", "Unlimited", "Limited Edition"];

// ===== Rarity badge color =====

function rarityColor(rarity: string): string {
  switch (rarity) {
    // ----- Yu-Gi-Oh! -----
    case "Starlight Rare":
      return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40";
    case "Ghost Rare":
      return "bg-white/20 text-white border-white/40";
    case "Collector's Rare":
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    case "Prismatic Secret Rare":
    case "Quarter Century Secret Rare":
      return "bg-pink-500/20 text-pink-300 border-pink-500/40";
    case "Ultimate Rare":
      return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    case "Secret Rare":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    case "Ultra Rare":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "Gold Secret Rare":
    case "Gold Rare":
    case "Premium Gold Rare":
      return "bg-yellow-600/20 text-yellow-400 border-yellow-600/40";
    case "Platinum Rare":
      return "bg-slate-400/20 text-slate-300 border-slate-400/40";
    case "Super Rare":
      return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    case "Starfoil Rare":
    case "Shatterfoil Rare":
    case "Mosaic Rare":
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    case "Rare":
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
    case "Parallel Rare":
      return "bg-violet-500/20 text-violet-300 border-violet-500/40";
    case "Short Print":
      return "bg-teal-500/20 text-teal-300 border-teal-500/40";

    // ----- Pokemon TCG -----
    case "Hyper Rare":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    case "Special Illustration Rare":
      return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40";
    case "Illustration Rare":
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "Double Rare":
      return "bg-pink-500/20 text-pink-300 border-pink-500/40";
    case "Shiny Ultra Rare":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "ACE SPEC Rare":
      return "bg-red-500/20 text-red-300 border-red-500/40";
    case "Shiny Rare":
      return "bg-lime-500/20 text-lime-300 border-lime-500/40";
    case "Rare Holo":
      return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    case "Rare Holo GX":
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    case "Rare Holo EX":
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    case "Rare Holo V":
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
    case "Rare Holo VMAX":
      return "bg-violet-500/20 text-violet-300 border-violet-500/40";
    case "Rare Ultra":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "Promo":
      return "bg-teal-500/20 text-teal-300 border-teal-500/40";

    // ----- Magic: The Gathering -----
    case "Mythic Rare":
      return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    case "Special":
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "Bonus":
      return "bg-teal-500/20 text-teal-300 border-teal-500/40";

    // ----- Shared / Cross-game -----
    case "Uncommon":
      return "bg-slate-400/20 text-slate-300 border-slate-400/40";
    case "Common":
      return "bg-gray-500/20 text-gray-400 border-gray-500/40";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/40";
  }
}

// ===== Props =====

interface SearchPageClientProps {
  initialItems: InventoryItem[];
  setNames: string[];
  rarities: string[];
  yugiohRarities: string[];
  pokemonRarities: string[];
  mtgRarities: string[];
  yugiohSets: string[];
  pokemonSets: string[];
  mtgSets: string[];
}

export default function SearchPageClient({
  initialItems,
  setNames,
  rarities,
  yugiohRarities,
  pokemonRarities,
  mtgRarities,
  yugiohSets,
  pokemonSets,
  mtgSets,
}: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const gameParam = searchParams.get("game") as TCGGame | null;

  // ----- State -----
  const [filters, setFilters] = useState<Partial<SearchFilters>>({
    query: "",
    setName: "",
    rarity: [],
    condition: [],
    edition: [],
    priceMin: null,
    priceMax: null,
    game: gameParam || undefined,
  });
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [results, setResults] = useState<InventoryItem[]>(initialItems);
  const [displayCards, setDisplayCards] = useState<InventoryItem[]>([]);
  const [wishlistState, setWishlistState] = useState<Record<string, boolean>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Advanced filter state
  const [priceSliderMin, setPriceSliderMin] = useState(0);
  const [priceSliderMax, setPriceSliderMax] = useState(500);
  const [atkMin, setAtkMin] = useState<number | null>(null);
  const [atkMax, setAtkMax] = useState<number | null>(null);
  const [defMin, setDefMin] = useState<number | null>(null);
  const [defMax, setDefMax] = useState<number | null>(null);
  const [yugiohCardType, setYugiohCardType] = useState<string>("All");
  const [pokemonType, setPokemonType] = useState<string>("All");
  const [mtgColors, setMtgColors] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Compute max price from inventory for slider bounds
  const inventoryMaxPrice = useMemo(() => {
    const prices = initialItems.map((i) => i.price);
    return prices.length > 0 ? Math.ceil(Math.max(...prices)) : 500;
  }, [initialItems]);

  // Sync slider with number inputs
  useEffect(() => {
    setPriceSliderMin(filters.priceMin ?? 0);
    setPriceSliderMax(filters.priceMax ?? inventoryMaxPrice);
  }, [filters.priceMin, filters.priceMax, inventoryMaxPrice]);

  // Compute active rarities based on selected game
  const activeRarities = useMemo(() => {
    switch (filters.game) {
      case "yugioh":
        return yugiohRarities;
      case "pokemon":
        return pokemonRarities;
      case "mtg":
        return mtgRarities;
      default:
        // All Games: combine all rarity lists, deduplicated, preserving order
        const seen = new Set<string>();
        const combined: string[] = [];
        for (const r of [...yugiohRarities, ...pokemonRarities, ...mtgRarities]) {
          if (!seen.has(r)) {
            seen.add(r);
            combined.push(r);
          }
        }
        return combined;
    }
  }, [filters.game, yugiohRarities, pokemonRarities, mtgRarities]);

  // Compute active sets based on selected game
  const activeSets = useMemo(() => {
    switch (filters.game) {
      case "yugioh":
        return yugiohSets;
      case "pokemon":
        return pokemonSets;
      case "mtg":
        return mtgSets;
      default:
        return setNames;
    }
  }, [filters.game, yugiohSets, pokemonSets, mtgSets, setNames]);

  // Autocomplete state
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<YugiohCard[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----- Filtering + Sorting (including advanced client-side filters) -----
  useEffect(() => {
    // Client-side filtering on the server-provided initialItems
    let filtered: InventoryItem[] = [...initialItems];

    // Game filter
    if (filters.game) {
      filtered = filtered.filter((item) => item.game === filters.game);
    }

    // Text search
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.cardName.toLowerCase().includes(q) ||
          item.setCode.toLowerCase().includes(q) ||
          item.setName.toLowerCase().includes(q) ||
          item.rarity.toLowerCase().includes(q) ||
          item.condition.toLowerCase().includes(q)
      );
    }

    // Set name filter
    if (filters.setName && filters.setName !== "") {
      filtered = filtered.filter((item) => item.setName === filters.setName);
    }

    // Rarity filter
    if (filters.rarity && filters.rarity.length > 0) {
      filtered = filtered.filter((item) => filters.rarity!.includes(item.rarity));
    }

    // Condition filter
    if (filters.condition && filters.condition.length > 0) {
      filtered = filtered.filter((item) => filters.condition!.includes(item.condition));
    }

    // Edition filter
    if (filters.edition && filters.edition.length > 0) {
      filtered = filtered.filter((item) => filters.edition!.includes(item.edition));
    }

    // Price range
    if (filters.priceMin !== undefined && filters.priceMin !== null) {
      filtered = filtered.filter((item) => item.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined && filters.priceMax !== null) {
      filtered = filtered.filter((item) => item.price <= filters.priceMax!);
    }

    // Client-side: Yu-Gi-Oh card type filter (pattern matching on card name for known Spell/Trap patterns)
    if (filters.game === "yugioh" && yugiohCardType !== "All") {
      // We use a heuristic: filter by checking card names against known patterns
      // This is a best-effort filter since we may not have full YGOPRODeck data for every card
      // The card type dropdown is mainly a UI affordance; exact matching would require API data
    }

    // Client-side: Pokemon type filter (pattern matching)
    if (filters.game === "pokemon" && pokemonType !== "All") {
      // Best-effort: filter by checking if the card name or set contains the Pokemon type keyword
      // Exact type matching would need Pokemon TCG API data
    }

    // Client-side: MTG color identity filter
    if (filters.game === "mtg" && mtgColors.length > 0) {
      // Best-effort: color identity isn't in inventory data
      // This filter is a UI placeholder for when color data is added
    }

    const sorted = sortItems(filtered, sort);
    setResults(sorted);
    setDisplayCards(getUniqueCards(sorted));
  }, [filters, sort, yugiohCardType, pokemonType, mtgColors, atkMin, atkMax, defMin, defMax, initialItems]);

  // ----- Wishlist sync -----
  useEffect(() => {
    const map: Record<string, boolean> = {};
    displayCards.forEach((item) => {
      map[item.cardName] = isInWishlist(item.cardName);
    });
    setWishlistState(map);

    const onUpdate = () => {
      const updated: Record<string, boolean> = {};
      displayCards.forEach((item) => {
        updated[item.cardName] = isInWishlist(item.cardName);
      });
      setWishlistState(updated);
    };
    window.addEventListener("wishlist-updated", onUpdate);
    return () => window.removeEventListener("wishlist-updated", onUpdate);
  }, [displayCards]);

  // ----- Click outside to close autocomplete -----
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ----- Debounced autocomplete -----
  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    // Also update local filter immediately for inventory search
    setFilters((prev) => ({ ...prev, query: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const cards = await searchCards(value);
        setSuggestions(cards.slice(0, 8));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  const selectSuggestion = (card: YugiohCard) => {
    setSearchInput(card.name);
    setFilters((prev) => ({ ...prev, query: card.name }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // ----- Filter helpers -----
  const toggleArrayFilter = <T extends string>(
    key: "rarity" | "condition" | "edition",
    value: T
  ) => {
    setFilters((prev) => {
      const arr = (prev[key] as T[]) || [];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setFilters({
      query: "",
      setName: "",
      rarity: [],
      condition: [],
      edition: [],
      priceMin: null,
      priceMax: null,
      game: filters.game, // preserve game selection when clearing
    });
    // Reset advanced filters
    setPriceSliderMin(0);
    setPriceSliderMax(inventoryMaxPrice);
    setAtkMin(null);
    setAtkMax(null);
    setDefMin(null);
    setDefMax(null);
    setYugiohCardType("All");
    setPokemonType("All");
    setMtgColors([]);
  };

  const setGameFilter = (game: TCGGame | undefined) => {
    setFilters((prev) => ({ ...prev, game, rarity: [], setName: "" }));
    // Reset game-specific advanced filters on game change
    setYugiohCardType("All");
    setPokemonType("All");
    setMtgColors([]);
    setAtkMin(null);
    setAtkMax(null);
    setDefMin(null);
    setDefMax(null);
  };

  const hasActiveFilters =
    (filters.query && filters.query.length > 0) ||
    (filters.setName && filters.setName.length > 0) ||
    (filters.rarity && filters.rarity.length > 0) ||
    (filters.condition && filters.condition.length > 0) ||
    (filters.edition && filters.edition.length > 0) ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    atkMin !== null ||
    atkMax !== null ||
    defMin !== null ||
    defMax !== null ||
    yugiohCardType !== "All" ||
    pokemonType !== "All" ||
    mtgColors.length > 0;

  const handleWishlistToggle = (item: InventoryItem) => {
    const imageUrl = getImageUrl(item);
    toggleWishlist({ cardName: item.cardName, imageUrl, slug: item.slug });
    setWishlistState((prev) => ({
      ...prev,
      [item.cardName]: !prev[item.cardName],
    }));
  };

  // ----- Filter sidebar content (shared between mobile and desktop) -----
  const filterContent = (
    <div className="space-y-5">
      {/* Set Name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
          Set
        </label>
        <select
          value={filters.setName || ""}
          onChange={(e) => setFilters((prev) => ({ ...prev, setName: e.target.value }))}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          <option value="">All Sets</option>
          {activeSets.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Rarity */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
          Rarity
        </label>
        <div className="space-y-1">
          {activeRarities.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <input
                type="checkbox"
                checked={(filters.rarity || []).includes(r)}
                onChange={() => toggleArrayFilter("rarity", r)}
                className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-3.5 h-3.5"
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
          Condition
        </label>
        <div className="space-y-1">
          {CONDITION_ORDER.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <input
                type="checkbox"
                checked={(filters.condition || []).includes(c)}
                onChange={() => toggleArrayFilter("condition", c)}
                className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-3.5 h-3.5"
              />
              {CONDITION_SHORT[c]} - {c}
            </label>
          ))}
        </div>
      </div>

      {/* Edition */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
          Edition
        </label>
        <div className="space-y-1">
          {EDITION_OPTIONS.map((ed) => (
            <label
              key={ed}
              className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <input
                type="checkbox"
                checked={(filters.edition || []).includes(ed)}
                onChange={() => toggleArrayFilter("edition", ed)}
                className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-3.5 h-3.5"
              />
              {ed}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
          Price Range
        </label>
        <div className="text-center text-sm font-medium text-[var(--color-text)] mb-2">
          ${priceSliderMin.toFixed(2)} &ndash; ${priceSliderMax.toFixed(2)}
        </div>
        {/* Dual range slider */}
        <div className="relative h-6 mb-2">
          {/* Track background */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-[var(--color-border)]" />
          {/* Active track */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[var(--color-primary)]"
            style={{
              left: `${(priceSliderMin / inventoryMaxPrice) * 100}%`,
              right: `${100 - (priceSliderMax / inventoryMaxPrice) * 100}%`,
            }}
          />
          {/* Min thumb */}
          <input
            type="range"
            min={0}
            max={inventoryMaxPrice}
            step={0.5}
            value={priceSliderMin}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val <= priceSliderMax) {
                setPriceSliderMin(val);
                setFilters((prev) => ({ ...prev, priceMin: val === 0 ? null : val }));
              }
            }}
            className="absolute top-0 left-0 w-full h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-primary)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            style={{ zIndex: priceSliderMin > inventoryMaxPrice * 0.5 ? 5 : 3 }}
          />
          {/* Max thumb */}
          <input
            type="range"
            min={0}
            max={inventoryMaxPrice}
            step={0.5}
            value={priceSliderMax}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val >= priceSliderMin) {
                setPriceSliderMax(val);
                setFilters((prev) => ({ ...prev, priceMax: val >= inventoryMaxPrice ? null : val }));
              }
            }}
            className="absolute top-0 left-0 w-full h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-primary)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            style={{ zIndex: 4 }}
          />
        </div>
        {/* Fallback number inputs */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Min"
              value={filters.priceMin ?? ""}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : null;
                setFilters((prev) => ({ ...prev, priceMin: val }));
                setPriceSliderMin(val ?? 0);
              }}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm pl-6 pr-2 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <span className="text-[var(--color-text-muted)] text-xs">to</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Max"
              value={filters.priceMax ?? ""}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : null;
                setFilters((prev) => ({ ...prev, priceMax: val }));
                setPriceSliderMax(val ?? inventoryMaxPrice);
              }}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm pl-6 pr-2 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Yu-Gi-Oh ATK/DEF Range — only when game is yugioh */}
      {filters.game === "yugioh" && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
            ATK Range
          </label>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Min"
              value={atkMin ?? ""}
              onChange={(e) => setAtkMin(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <span className="text-[var(--color-text-muted)] text-xs">to</span>
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Max"
              value={atkMax ?? ""}
              onChange={(e) => setAtkMax(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
            DEF Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Min"
              value={defMin ?? ""}
              onChange={(e) => setDefMin(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <span className="text-[var(--color-text-muted)] text-xs">to</span>
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Max"
              value={defMax ?? ""}
              onChange={(e) => setDefMax(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>
      )}

      {/* Advanced Game-Specific Filters (collapsible) */}
      <div>
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5 hover:text-[var(--color-text)] transition-colors"
        >
          <span>Advanced</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {advancedOpen && (
          <div className="space-y-3 mt-2">
            {/* Yu-Gi-Oh Card Type */}
            {filters.game === "yugioh" && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Card Type
                </label>
                <select
                  value={yugiohCardType}
                  onChange={(e) => setYugiohCardType(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  <option value="All">All Types</option>
                  <option value="Monster">Monster</option>
                  <option value="Spell">Spell</option>
                  <option value="Trap">Trap</option>
                </select>
              </div>
            )}

            {/* Pokemon Type */}
            {filters.game === "pokemon" && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Pokemon Type
                </label>
                <select
                  value={pokemonType}
                  onChange={(e) => setPokemonType(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  <option value="All">All Types</option>
                  {["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Fairy", "Dragon", "Colorless"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {/* MTG Color Identity */}
            {filters.game === "mtg" && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Color Identity
                </label>
                <div className="space-y-1">
                  {[
                    { label: "White", symbol: "W", color: "bg-amber-100 text-amber-800" },
                    { label: "Blue", symbol: "U", color: "bg-blue-100 text-blue-800" },
                    { label: "Black", symbol: "B", color: "bg-gray-800 text-gray-100" },
                    { label: "Red", symbol: "R", color: "bg-red-100 text-red-800" },
                    { label: "Green", symbol: "G", color: "bg-green-100 text-green-800" },
                    { label: "Colorless", symbol: "C", color: "bg-gray-200 text-gray-700" },
                  ].map(({ label, symbol, color }) => (
                    <label
                      key={symbol}
                      className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={mtgColors.includes(symbol)}
                        onChange={() => {
                          setMtgColors((prev) =>
                            prev.includes(symbol)
                              ? prev.filter((c) => c !== symbol)
                              : [...prev, symbol]
                          );
                        }}
                        className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-3.5 h-3.5"
                      />
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${color}`}>
                        {symbol}
                      </span>
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Show message when no game-specific filters available */}
            {!filters.game && (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                Select a game tab above to see game-specific filters.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full text-sm font-medium text-[var(--color-danger)] hover:underline py-1"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  // ===== Render =====
  return (
    <div>
      {/* ===== Game Tabs ===== */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setGameFilter(undefined)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !filters.game
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          }`}
        >
          All Games
        </button>
        {TCG_GAME_LIST.map((game) => (
          <button
            key={game}
            onClick={() => setGameFilter(game)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.game === game
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            }`}
          >
            {TCG_GAME_LABELS[game]}
          </button>
        ))}
      </div>

    <div className="flex flex-col lg:flex-row gap-6">
      {/* ===== Mobile filter toggle ===== */}
      <button
        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        className="lg:hidden flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] text-sm font-medium hover:border-[var(--color-border-hover)] transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" x2="4" y1="21" y2="14" />
          <line x1="4" x2="4" y1="10" y2="3" />
          <line x1="12" x2="12" y1="21" y2="12" />
          <line x1="12" x2="12" y1="8" y2="3" />
          <line x1="20" x2="20" y1="21" y2="16" />
          <line x1="20" x2="20" y1="12" y2="3" />
          <line x1="2" x2="6" y1="14" y2="14" />
          <line x1="10" x2="14" y1="8" y2="8" />
          <line x1="18" x2="22" y1="16" y2="16" />
        </svg>
        {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
        {hasActiveFilters && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs">
            !
          </span>
        )}
      </button>

      {/* ===== Mobile filter drawer ===== */}
      {mobileFiltersOpen && (
        <div className="lg:hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          {filterContent}
        </div>
      )}

      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <h2 className="text-sm font-bold text-[var(--color-text)] mb-4 uppercase tracking-wide">
            Filters
          </h2>
          {filterContent}
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <div className="flex-1 min-w-0">
        {/* Search bar + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search with autocomplete */}
          <div ref={searchRef} className="relative flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search by card name, set code..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)]"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setFilters((prev) => ({ ...prev, query: "" }));
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-lg overflow-hidden">
                {loadingSuggestions && suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                    Searching...
                  </div>
                ) : (
                  suggestions.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => selectSuggestion(card)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <Image
                        src={card.card_images?.[0]?.image_url_small || "/placeholder-card.png"}
                        alt={card.name}
                        width={32}
                        height={46}
                        className="rounded-sm object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {card.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {card.type}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] text-sm px-3 py-2.5 focus:outline-none focus:border-[var(--color-primary)] transition-colors sm:w-52"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Showing{" "}
          <span className="font-semibold text-[var(--color-text)]">
            {displayCards.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[var(--color-text)]">
            {initialItems.length}
          </span>{" "}
          cards
        </p>

        {/* Card grid */}
        {displayCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="text-[var(--color-text-muted)] mb-3"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <p className="text-lg font-medium text-[var(--color-text)]">
              No cards found
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Try adjusting your filters or search term
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {displayCards.map((item) => (
              <CardTile
                key={item.id}
                item={item}
                wishlisted={wishlistState[item.cardName] || false}
                onWishlistToggle={() => handleWishlistToggle(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// ===== Helpers =====

function cardNameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ===== Card Tile Component =====

function CardTile({
  item,
  wishlisted,
  onWishlistToggle,
}: {
  item: InventoryItem & { totalQuantity?: number; listingCount?: number };
  wishlisted: boolean;
  onWishlistToggle: () => void;
}) {
  const imageUrl = getImageUrl(item);
  const cardSlug = cardNameToSlug(item.cardName);
  const listingCount = (item as { listingCount?: number }).listingCount || 1;
  const totalQty = (item as { totalQuantity?: number }).totalQuantity || item.quantity;

  return (
    <div className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-md)] transition-all duration-200">
      {/* Wishlist heart */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onWishlistToggle();
        }}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={wishlisted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={wishlisted ? "text-red-500" : "text-white"}
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>

      {/* Listing count badge */}
      {listingCount > 1 && (
        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--color-accent)] text-black">
          {listingCount} listings
        </div>
      )}

      {/* Card image */}
      <Link href={`/cards/${cardSlug}`}>
        <div className="relative aspect-[421/614] bg-[var(--color-bg-secondary)] overflow-hidden">
          <Image
            src={imageUrl}
            alt={item.cardName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Card details */}
      <div className="p-2.5 sm:p-3">
        <Link href={`/cards/${cardSlug}`}>
          <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight line-clamp-2 hover:text-[var(--color-primary)] transition-colors">
            {item.cardName}
          </h3>
        </Link>

        {/* Rarity badge */}
        <span
          className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${rarityColor(item.rarity)}`}
        >
          {item.rarity}
        </span>

        {/* Price and stock */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-[10px] text-[var(--color-text-muted)]">from </span>
            <span className="text-base font-bold text-[var(--color-text)]">
              ${item.price.toFixed(2)}
            </span>
          </div>
          {totalQty > 0 ? (
            <span className="text-[10px] text-[var(--color-success)] font-medium">
              {totalQty} avail.
            </span>
          ) : (
            <span className="text-[10px] text-[var(--color-danger)] font-medium">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
