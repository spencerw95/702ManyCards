import { NextRequest, NextResponse } from "next/server";

// ===== Scryfall types =====

interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  type_line?: string;
  image_uris?: { small?: string; normal?: string; large?: string };
  card_faces?: { image_uris?: { small?: string; normal?: string; large?: string } }[];
  prices: {
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
    eur?: string | null;
    eur_foil?: string | null;
  };
  purchase_uris?: {
    tcgplayer?: string;
    cardmarket?: string;
  };
  scryfall_uri?: string;
  related_uris?: {
    tcgplayer_infinite_articles?: string;
    tcgplayer_infinite_decks?: string;
    edhrec?: string;
  };
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
    let card: ScryfallCard | null = null;

    // Strategy 1: If set and number provided, use exact endpoint
    if (set && number) {
      const exactUrl = `https://api.scryfall.com/cards/${encodeURIComponent(set.toLowerCase())}/${encodeURIComponent(number)}`;
      const res = await fetch(exactUrl, {
        headers: {
          "User-Agent": "702ManyCards/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        card = await res.json();
      }
    }

    // Strategy 2: Try exact name search
    if (!card) {
      const namedUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}${set ? `&set=${encodeURIComponent(set.toLowerCase())}` : ""}`;
      const res = await fetch(namedUrl, {
        headers: {
          "User-Agent": "702ManyCards/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        card = await res.json();
      }
    }

    // Strategy 3: Fuzzy name search
    if (!card) {
      const fuzzyUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
      const res = await fetch(fuzzyUrl, {
        headers: {
          "User-Agent": "702ManyCards/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        card = await res.json();
      }
    }

    if (!card) {
      return NextResponse.json({ error: "Card not found", prices: null }, { status: 404 });
    }

    // Get image — handle double-faced cards
    const image =
      card.image_uris?.normal ||
      card.image_uris?.large ||
      card.card_faces?.[0]?.image_uris?.normal ||
      card.card_faces?.[0]?.image_uris?.large ||
      null;

    // Capitalize rarity
    const rarityLabel = card.rarity
      ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)
      : "Unknown";

    return NextResponse.json({
      name: card.name,
      set: card.set_name,
      setCode: card.set.toUpperCase(),
      number: card.collector_number,
      rarity: rarityLabel,
      typeLine: card.type_line || "",
      image,
      prices: {
        tcgplayer: {
          usd: card.prices.usd || null,
          usd_foil: card.prices.usd_foil || null,
          usd_etched: card.prices.usd_etched || null,
        },
        cardmarket: {
          eur: card.prices.eur || null,
          eur_foil: card.prices.eur_foil || null,
        },
      },
      urls: {
        tcgplayer: card.purchase_uris?.tcgplayer || `https://www.tcgplayer.com/search/magic/product?q=${encodeURIComponent(card.name)}&view=grid`,
        cardmarket: card.purchase_uris?.cardmarket || `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(card.name)}`,
        scryfall: card.scryfall_uri || `https://scryfall.com/search?q=${encodeURIComponent(card.name)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch MTG card data" }, { status: 500 });
  }
}
