import { Suspense } from "react";
import { getAllAccessories } from "@/lib/accessories";
import AccessoriesPageClient from "./AccessoriesPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accessories & Sealed Products | 702ManyCards",
  description: "Shop playmats, deck boxes, card sleeves, booster boxes, starter decks, tins and bundles. Yu-Gi-Oh!, Pokemon, and MTG sealed products from Konami, The Pokemon Company, and Wizards of the Coast.",
};

export default async function AccessoriesPage() {
  const allAccessories = await getAllAccessories();

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Accessories & Sealed Products
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Playmats, deck boxes, card sleeves, booster boxes, starter decks, and more for your collection
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>}>
          <AccessoriesPageClient initialItems={allAccessories} />
        </Suspense>
      </div>
    </main>
  );
}
