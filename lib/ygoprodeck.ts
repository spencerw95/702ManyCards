import type { YugiohCard, YGOProDeckResponse, YGOCardSet } from "./types";

const BASE_URL = "https://db.ygoprodeck.com/api/v7";

// ===== Cache Utility =====

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`ygopro_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(`ygopro_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
    localStorage.setItem(`ygopro_${key}`, JSON.stringify(entry));
  } catch {
    // localStorage full — silently fail
  }
}

// ===== Rate Limiter =====

const requestQueue: Array<() => void> = [];
let activeRequests = 0;
const MAX_CONCURRENT = 15;

function enqueueRequest(): Promise<void> {
  return new Promise((resolve) => {
    const tryExecute = () => {
      if (activeRequests < MAX_CONCURRENT) {
        activeRequests++;
        resolve();
      } else {
        requestQueue.push(tryExecute);
      }
    };
    tryExecute();
  });
}

function releaseRequest(): void {
  activeRequests--;
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    next?.();
  }
}

async function fetchWithRateLimit<T>(url: string, cacheKey: string, ttlMs: number): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  await enqueueRequest();
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited — wait and retry once
        await new Promise((r) => setTimeout(r, 5000));
        const retryResponse = await fetch(url);
        if (!retryResponse.ok) throw new Error(`API error: ${retryResponse.status}`);
        const data = await retryResponse.json();
        setCache(cacheKey, data, ttlMs);
        return data;
      }
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    setCache(cacheKey, data, ttlMs);
    return data;
  } finally {
    releaseRequest();
  }
}

// ===== API Functions =====

const TTL_AUTOCOMPLETE = 2 * 60 * 60 * 1000; // 2 hours
const TTL_CARD_DETAIL = 48 * 60 * 60 * 1000; // 48 hours
const TTL_SETS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fuzzy search cards by name. Used for autocomplete.
 * Returns up to 10 matches.
 */
export async function searchCards(query: string): Promise<YugiohCard[]> {
  if (!query || query.length < 2) return [];

  const cacheKey = `search_${query.toLowerCase()}`;
  try {
    const response = await fetchWithRateLimit<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?fname=${encodeURIComponent(query)}&num=10&offset=0`,
      cacheKey,
      TTL_AUTOCOMPLETE
    );
    return response.data || [];
  } catch {
    return [];
  }
}

/**
 * Get full card data by exact name.
 */
export async function getCardByName(name: string): Promise<YugiohCard | null> {
  if (!name) return null;

  const cacheKey = `card_${name.toLowerCase()}`;
  try {
    const response = await fetchWithRateLimit<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?name=${encodeURIComponent(name)}`,
      cacheKey,
      TTL_CARD_DETAIL
    );
    return response.data?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get all card sets. Used to populate set filter dropdown.
 */
export async function getAllSets(): Promise<YGOCardSet[]> {
  const cacheKey = "all_sets";
  try {
    const sets = await fetchWithRateLimit<YGOCardSet[]>(
      `${BASE_URL}/cardsets.php`,
      cacheKey,
      TTL_SETS
    );
    return sets.sort((a, b) => a.set_name.localeCompare(b.set_name));
  } catch {
    return [];
  }
}

/**
 * Search cards with filters. Used for advanced search.
 */
export async function getCardsByFilters(filters: {
  type?: string;
  race?: string;
  attribute?: string;
  cardset?: string;
  fname?: string;
}): Promise<YugiohCard[]> {
  const params = new URLSearchParams();
  if (filters.fname) params.set("fname", filters.fname);
  if (filters.type) params.set("type", filters.type);
  if (filters.race) params.set("race", filters.race);
  if (filters.attribute) params.set("attribute", filters.attribute);
  if (filters.cardset) params.set("cardset", filters.cardset);

  const cacheKey = `filters_${params.toString()}`;
  try {
    const response = await fetchWithRateLimit<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?${params.toString()}`,
      cacheKey,
      TTL_AUTOCOMPLETE
    );
    return response.data || [];
  } catch {
    return [];
  }
}

/**
 * Get the small image URL for a card.
 */
export function getCardImageUrl(card: YugiohCard, size: "small" | "normal" | "cropped" = "small"): string {
  const image = card.card_images?.[0];
  if (!image) return "/placeholder-card.png";

  switch (size) {
    case "small":
      return image.image_url_small;
    case "cropped":
      return image.image_url_cropped;
    default:
      return image.image_url;
  }
}

/**
 * Get TCGPlayer market price for a card.
 */
export function getMarketPrice(card: YugiohCard): number {
  const price = card.card_prices?.[0]?.tcgplayer_price;
  return price ? parseFloat(price) : 0;
}

/**
 * Get all market prices for a card.
 */
export function getAllMarketPrices(card: YugiohCard): Record<string, number> {
  const prices = card.card_prices?.[0];
  if (!prices) return {};

  return {
    tcgplayer: parseFloat(prices.tcgplayer_price) || 0,
    cardmarket: parseFloat(prices.cardmarket_price) || 0,
    ebay: parseFloat(prices.ebay_price) || 0,
    amazon: parseFloat(prices.amazon_price) || 0,
    coolstuffinc: parseFloat(prices.coolstuffinc_price) || 0,
  };
}
