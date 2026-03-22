import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell Us Your Cards | 702ManyCards",
  description: "Got cards to sell? Submit photos and we'll make you an offer within 24 hours.",
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
