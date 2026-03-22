import { Suspense } from "react";
import { getAllItems, getUniqueSetNames, getUniqueRarities, ALL_YUGIOH_RARITIES, ALL_POKEMON_RARITIES, ALL_MTG_RARITIES, getSetNamesForGame } from "@/lib/inventory";
import SearchPageClient from "@/components/SearchPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Cards | 702ManyCards",
  description: "Search and browse our full trading card inventory. Yu-Gi-Oh!, Pokemon, Magic: The Gathering, and Riftbound singles.",
};

export default async function SearchPage() {
  const allItems = await getAllItems();
  const setNames = await getUniqueSetNames();
  const inventoryRarities = await getUniqueRarities();

  // Build ordered rarity lists for each game: in-stock first, then out-of-stock
  const buildOrderedRarities = (masterList: string[]) => [
    ...masterList.filter((r) => inventoryRarities.includes(r)),
    ...masterList.filter((r) => !inventoryRarities.includes(r)),
  ];

  const yugiohRarities = buildOrderedRarities(ALL_YUGIOH_RARITIES);
  const pokemonRarities = buildOrderedRarities(ALL_POKEMON_RARITIES);
  const mtgRarities = buildOrderedRarities(ALL_MTG_RARITIES);

  // Per-game set names
  const yugiohSets = await getSetNamesForGame("yugioh");
  const pokemonSets = await getSetNamesForGame("pokemon");
  const mtgSets = await getSetNamesForGame("mtg");

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Browse Cards
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Search our full inventory of trading card singles
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>}>
          <SearchPageClient
            initialItems={allItems}
            setNames={setNames}
            rarities={yugiohRarities}
            yugiohRarities={yugiohRarities}
            pokemonRarities={pokemonRarities}
            mtgRarities={mtgRarities}
            yugiohSets={yugiohSets}
            pokemonSets={pokemonSets}
            mtgSets={mtgSets}
          />
        </Suspense>
      </div>
    </main>
  );
}
