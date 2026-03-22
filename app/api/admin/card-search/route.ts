import { NextRequest, NextResponse } from "next/server";
import type { TCGGame, UnifiedCardResult } from "@/lib/types";

// ===== Yu-Gi-Oh (YGOPRODeck) =====

interface YGOCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  race: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  linkval?: number;
  scale?: number;
  card_sets?: {
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_rarity_code: string;
    set_price: string;
  }[];
  card_images: { id: number; image_url: string; image_url_small: string }[];
}

function mapYugioh(cards: YGOCard[]): UnifiedCardResult[] {
  return cards.map((c) => {
    const stats: Record<string, string | number> = {};
    if (c.attribute) stats.Attribute = c.attribute;
    if (c.race) stats.Race = c.race;
    if (c.level !== undefined) stats.Level = c.level;
    if (c.atk !== undefined) stats.ATK = c.atk;
    if (c.def !== undefined) stats.DEF = c.def;
    if (c.linkval !== undefined) stats.Link = c.linkval;
    if (c.scale !== undefined) stats.Scale = c.scale;

    return {
      id: String(c.id),
      name: c.name,
      type: c.type,
      description: c.desc,
      imageSmall: c.card_images?.[0]?.image_url_small || "",
      imageLarge: c.card_images?.[0]?.image_url || "",
      game: "yugioh" as TCGGame,
      stats,
      printings: (c.card_sets || []).map((s) => ({
        setCode: s.set_code,
        setName: s.set_name,
        rarity: s.set_rarity,
        price: s.set_price,
      })),
    };
  });
}

async function searchYugioh(query: string): Promise<UnifiedCardResult[]> {
  const res = await fetch(
    `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=15&offset=0`
  );
  if (!res.ok) return [];
  const json = await res.json();
  return mapYugioh(json.data || []);
}

// ===== Pokemon TCG =====

interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  set: { id: string; name: string; series: string };
  images: { small: string; large: string };
  rarity?: string;
  number?: string;
  tcgplayer?: {
    url?: string;
    prices?: Record<string, { market?: number; low?: number } | undefined>;
  };
}

function getPokemonPrice(card: PokemonCard): string | undefined {
  const prices = card.tcgplayer?.prices;
  if (!prices) return undefined;
  // Try normal, then holofoil, then reverseHolofoil, then first available
  for (const variant of ["normal", "holofoil", "reverseHolofoil"]) {
    const p = prices[variant];
    if (p?.market) return p.market.toFixed(2);
    if (p?.low) return p.low.toFixed(2);
  }
  // Fallback: first variant with a price
  for (const key of Object.keys(prices)) {
    const p = prices[key];
    if (p?.market) return p.market.toFixed(2);
    if (p?.low) return p.low.toFixed(2);
  }
  return undefined;
}

function mapPokemon(cards: PokemonCard[]): UnifiedCardResult[] {
  return cards.map((c) => {
    const stats: Record<string, string | number> = {};
    if (c.hp) stats.HP = c.hp;
    if (c.types && c.types.length > 0) stats.Types = c.types.join(", ");
    if (c.subtypes && c.subtypes.length > 0) stats.Subtypes = c.subtypes.join(", ");

    const typeLabel = [c.supertype, ...(c.subtypes || [])].filter(Boolean).join(" - ");

    return {
      id: c.id,
      name: c.name,
      type: typeLabel || c.supertype,
      description: "",
      imageSmall: c.images?.small || "",
      imageLarge: c.images?.large || "",
      game: "pokemon" as TCGGame,
      stats,
      printings: [
        {
          setCode: c.set.id,
          setName: c.set.name,
          rarity: c.rarity || "Unknown",
          number: c.number,
          price: getPokemonPrice(c),
        },
      ],
    };
  });
}

async function searchPokemon(query: string): Promise<UnifiedCardResult[]> {
  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(query)}*&pageSize=15&select=id,name,supertype,subtypes,hp,types,set,images,rarity,number,tcgplayer`
  );
  if (!res.ok) return [];
  const json = await res.json();
  return mapPokemon(json.data || []);
}

// ===== Magic: The Gathering (Scryfall) =====

interface ScryfallCard {
  id: string;
  name: string;
  type_line?: string;
  oracle_text?: string;
  mana_cost?: string;
  cmc?: number;
  set: string;
  set_name: string;
  collector_number?: string;
  rarity?: string;
  image_uris?: { small?: string; normal?: string; large?: string };
  card_faces?: { image_uris?: { small?: string; normal?: string; large?: string }; oracle_text?: string }[];
  prices?: { usd?: string | null; usd_foil?: string | null };
  power?: string;
  toughness?: string;
  loyalty?: string;
}

function mapMTG(cards: ScryfallCard[]): UnifiedCardResult[] {
  return cards.slice(0, 15).map((c) => {
    const stats: Record<string, string | number> = {};
    if (c.mana_cost) stats["Mana Cost"] = c.mana_cost;
    if (c.cmc !== undefined) stats.CMC = c.cmc;
    if (c.power) stats.Power = c.power;
    if (c.toughness) stats.Toughness = c.toughness;
    if (c.loyalty) stats.Loyalty = c.loyalty;

    // Some cards (double-faced) don't have image_uris at top level
    const imgSmall =
      c.image_uris?.small || c.card_faces?.[0]?.image_uris?.small || "";
    const imgLarge =
      c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || "";

    const oracleText =
      c.oracle_text ||
      c.card_faces?.map((f) => f.oracle_text).filter(Boolean).join("\n\n") ||
      "";

    const price = c.prices?.usd || c.prices?.usd_foil || undefined;

    return {
      id: c.id,
      name: c.name,
      type: c.type_line || "",
      description: oracleText,
      imageSmall: imgSmall,
      imageLarge: imgLarge,
      game: "mtg" as TCGGame,
      stats,
      printings: [
        {
          setCode: c.set.toUpperCase(),
          setName: c.set_name,
          rarity: c.rarity || "Unknown",
          number: c.collector_number,
          price: price || undefined,
        },
      ],
    };
  });
}

async function searchMTG(query: string): Promise<UnifiedCardResult[]> {
  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`,
    {
      headers: {
        "User-Agent": "702ManyCards/1.0",
        Accept: "application/json",
      },
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return mapMTG(json.data || []);
}

// ===== Route handler =====

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const game = (searchParams.get("game") || "yugioh") as TCGGame;

  if (!query || query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    let results: UnifiedCardResult[];

    switch (game) {
      case "pokemon":
        results = await searchPokemon(query);
        break;
      case "mtg":
        results = await searchMTG(query);
        break;
      case "yugioh":
      default:
        results = await searchYugioh(query);
        break;
    }

    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json({ data: [], error: "Failed to fetch" }, { status: 500 });
  }
}
