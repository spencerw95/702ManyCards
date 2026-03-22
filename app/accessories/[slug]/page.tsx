import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllAccessories, getAccessoryBySlug } from "@/lib/accessories";
import AccessoryDetailClient from "./AccessoryDetailClient";
import ReviewSection from "@/components/ReviewSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getAccessoryBySlug(slug);

  if (!item) {
    return { title: "Product Not Found | 702ManyCards" };
  }

  return {
    title: `${item.name} | 702ManyCards`,
    description: item.description,
  };
}

export async function generateStaticParams() {
  const items = getAllAccessories();
  return items.map((item) => ({ slug: item.slug }));
}

export default async function AccessoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getAccessoryBySlug(slug);

  if (!item) {
    notFound();
  }

  // Get related items in same category
  const related = getAllAccessories()
    .filter((i) => i.category === item.category && i.slug !== item.slug)
    .slice(0, 4);

  return (
    <>
      <AccessoryDetailClient item={item} relatedItems={related} />
      <ReviewSection productSlug={slug} productName={item.name} productType="accessory" />
    </>
  );
}
