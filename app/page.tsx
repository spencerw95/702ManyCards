import Link from "next/link";
import Image from "next/image";
import { getInventoryStats, getNewArrivals, getUniqueCards, sortItems } from "@/lib/inventory";
import RecentlyViewed from "@/components/RecentlyViewed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stats = await getInventoryStats();
  const allNewArrivals = await getNewArrivals(7);
  const newArrivals = getUniqueCards(allNewArrivals);
  const allNewArrivals30 = await getNewArrivals(30);
  const featured = getUniqueCards(sortItems(allNewArrivals30, "price-desc")).slice(0, 8);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0D0F1A] via-[#1A1040] to-[#151828] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {/* Centered Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="702 Many Cards"
              className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_0_30px_rgba(78,234,255,0.3)]"
            />
          </div>

          {/* Centered text */}
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Premium trading cards from a trusted collector. Yu-Gi-Oh!, Pokemon &amp; MTG singles — every card inspected, graded, and shipped with care.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-lg bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Browse Cards
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-lg border border-[var(--color-primary)]/50 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
              >
                Sell Your Cards
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <span className="text-2xl font-bold text-[var(--color-primary)]">{stats.totalListings}</span>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Cards in Stock</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-[var(--color-primary)]">{stats.uniqueCards}</span>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Unique Cards</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-[var(--color-primary)]">{stats.totalSets}</span>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Sets Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">New Arrivals</h2>
            <Link href="/search?sort=newest" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {newArrivals.slice(0, 10).map((item) => (
              <Link
                key={item.id}
                href={`/cards/${item.slug}`}
                className="group block p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover"
              >
                <div className="aspect-[421/614] relative mb-2 rounded overflow-hidden bg-[var(--color-bg-secondary)]">
                  <Image
                    src={getImageUrl(item)}
                    alt={item.cardName}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    unoptimized
                  />
                </div>
                <h3 className="font-medium text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                  {item.cardName}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.setCode} &middot; {item.rarity}</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-sm">${item.price.toFixed(2)}</span>
                  {item.edition === "1st Edition" && (
                    <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)]">1st Ed</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured / High Value */}
      {featured.length > 0 && (
        <section className="bg-[var(--color-bg-secondary)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Featured Cards</h2>
              <Link href="/search?sort=price-desc" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featured.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={`/cards/${item.slug}`}
                  className="group block p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover"
                >
                  <div className="aspect-[421/614] relative mb-2 rounded overflow-hidden bg-[var(--color-bg-secondary)]">
                    <Image
                      src={getImageUrl(item)}
                      alt={item.cardName}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      unoptimized
                    />
                  </div>
                  <h3 className="font-medium text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {item.cardName}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.setCode} &middot; {item.rarity}</p>
                  <p className="font-bold text-sm mt-1">${item.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Duel?</h2>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
          Browse our full collection and find the cards you need. Free shipping on orders over $25.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-lg text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Browse All Cards
        </Link>
      </section>
    </div>
  );
}

// Temporary helper — in production, we'd use YGOPRODeck API to look up card IDs
// For now, we'll use a hardcoded map of our demo cards
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

function getCardId(cardName: string): number {
  return CARD_IDS[cardName] || 46986414; // fallback to Dark Magician
}

function getImageUrl(item: { cardName: string; imageUrl?: string }): string {
  // Use the item's own imageUrl if it has one (Pokemon, MTG, etc.)
  if (item.imageUrl) return item.imageUrl;
  // Otherwise use YGOPRODeck
  return `https://images.ygoprodeck.com/images/cards_small/${getCardId(item.cardName)}.jpg`;
}
