import { NextRequest, NextResponse } from "next/server";

// ===== Pokemon TCG API types =====

interface PokemonTCGPriceVariant {
  low?: number | null;
  mid?: number | null;
  high?: number | null;
  market?: number | null;
  directLow?: number | null;
}

interface PokemonTCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  set: { id: string; name: string; series: string };
  number: string;
  rarity?: string;
  images: { small: string; large: string };
  tcgplayer?: {
    url?: string;
    updatedAt?: string;
    prices?: Record<string, PokemonTCGPriceVariant | undefined>;
  };
}

// ===== Helpers =====

function pickBestVariant(
  prices: Record<string, PokemonTCGPriceVariant | undefined>
): { variant: string; data: PokemonTCGPriceVariant } | null {
  let best: { variant: string; data: PokemonTCGPriceVariant } | null = null;
  let bestMarket = -1;

  for (const [variant, data] of Object.entries(prices)) {
    if (!data) continue;
    const m = data.market ?? data.mid ?? data.low ?? 0;
    if (m > bestMarket) {
      bestMarket = m;
      best = { variant, data };
    }
  }
  return best;
}

function buildAllVariants(
  prices: Record<string, PokemonTCGPriceVariant | undefined>
): Record<string, { market: number | null; low: number | null; mid: number | null; high: number | null }> {
  const result: Record<string, { market: number | null; low: number | null; mid: number | null; high: number | null }> = {};
  for (const [variant, data] of Object.entries(prices)) {
    if (!data) continue;
    result[variant] = {
      market: data.market ?? null,
      low: data.low ?? null,
      mid: data.mid ?? null,
      high: data.high ?? null,
    };
  }
  return result;
}

// ===== Route handler =====

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const set = searchParams.get("set");
  const number = searchParams.get("number");

  if (!name) {
    return NextResponse.json({ error: "Missing 'name' parameter" }, { status: 400 });
  }

  try {
    // Build query
    let query = `name:"${name}"`;
    if (set) query += ` set.id:${set}`;
    if (number) query += ` number:${number}`;

    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=5&select=id,name,supertype,subtypes,set,number,rarity,images,tcgplayer`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Pokemon TCG API error", status: res.status }, { status: 502 });
    }

    const json = await res.json();
    const cards: PokemonTCGCard[] = json.data || [];

    if (cards.length === 0) {
      return NextResponse.json({ error: "Card not found", prices: null }, { status: 404 });
    }

    // Pick the first card (most relevant)
    const card = cards[0];
    const prices = card.tcgplayer?.prices;
    const bestVariant = prices ? pickBestVariant(prices) : null;
    const allVariants = prices ? buildAllVariants(prices) : {};

    return NextResponse.json({
      name: card.name,
      set: card.set.name,
      setId: card.set.id,
      number: card.number,
      rarity: card.rarity || "Unknown",
      image: card.images.large,
      prices: {
        tcgplayer: bestVariant
          ? {
              market: bestVariant.data.market ?? null,
              low: bestVariant.data.low ?? null,
              mid: bestVariant.data.mid ?? null,
              high: bestVariant.data.high ?? null,
              variant: bestVariant.variant,
            }
          : null,
        allVariants,
        cardmarket: null,
      },
      url: card.tcgplayer?.url || `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name)}&view=grid`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Pokemon card data" }, { status: 500 });
  }
}
