import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllItems, getItemsByCardName } from "@/lib/inventory";
import CardDetailClient from "@/components/CardDetailClient";
import ReviewSection from "@/components/ReviewSection";
import RelatedCards from "@/components/RelatedCards";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Convert a card name slug back to find matching cards.
 * Slug format: "dark-magician" matches card name "Dark Magician"
 */
async function findCardBySlug(slug: string) {
  const items = await getAllItems();

  // First try: exact slug match on individual listings (backwards compat)
  const exactMatch = items.find((i) => i.slug === slug);
  if (exactMatch) return exactMatch;

  // Second try: match by card name slug (new format — one page per card name)
  const normalizedSlug = slug.toLowerCase();
  const match = items.find((i) => {
    const nameSlug = i.cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return nameSlug === normalizedSlug;
  });

  return match || null;
}

async function getUniqueCardNames(): Promise<string[]> {
  const items = await getAllItems();
  const names = new Set(items.map((i) => i.cardName));
  return Array.from(names);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await findCardBySlug(slug);

  if (!item) {
    return { title: "Card Not Found | 702ManyCards" };
  }

  const allListings = await getItemsByCardName(item.cardName);
  const lowestPrice = Math.min(...allListings.map((i) => i.price));
  const listingCount = allListings.length;

  return {
    title: `${item.cardName} | 702ManyCards`,
    description: `Buy ${item.cardName} at 702ManyCards. ${listingCount} listing${listingCount > 1 ? "s" : ""} starting from $${lowestPrice.toFixed(2)}. Multiple editions, conditions, and rarities available.`,
    openGraph: {
      title: `${item.cardName} | 702ManyCards`,
      description: `${item.cardName} — ${listingCount} listing${listingCount > 1 ? "s" : ""} from $${lowestPrice.toFixed(2)}`,
    },
  };
}

export async function generateStaticParams() {
  // With force-dynamic, this won't be used at build time for ISR,
  // but we keep it for compatibility. Return empty to avoid build-time Supabase calls.
  return [];
}

export default async function CardDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await findCardBySlug(slug);

  if (!item) {
    notFound();
  }

  // Get ALL listings for this card name — every set, edition, condition
  const allListings = await getItemsByCardName(item.cardName);

  const cardSlug = item.cardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <>
      <CardDetailClient item={item} relatedItems={allListings} />
      <ReviewSection productSlug={slug} productName={item.cardName} productType="card" />
      <RelatedCards
        cardName={item.cardName}
        setName={item.setName}
        rarity={item.rarity}
        game={item.game}
        currentSlug={cardSlug}
      />
    </>
  );
}
