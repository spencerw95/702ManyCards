import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Card Condition Guide | 702ManyCards",
  description:
    "Understand TCG card condition grades from Near Mint to Damaged. Learn what to look for, how condition affects price, and tournament playability for Yu-Gi-Oh singles.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

interface Condition {
  abbr: string;
  name: string;
  icon: string;
  color: string;       // tailwind-safe color for the indicator bar
  colorHex: string;    // hex for inline gradient stop
  description: string;
  lookFor: string[];
  priceImpact: string;
  playability: string;
  edgeWear: string;
  surface: string;
  creasing: string;
  typicalPricePct: string;
}

const CONDITIONS: Condition[] = [
  {
    abbr: "NM",
    name: "Near Mint",
    icon: "\u2728",
    color: "bg-emerald-500",
    colorHex: "#10b981",
    description:
      "Perfect or near-perfect. No visible wear. Front is clean, back has no whitening. This is a freshly pulled or well-protected card.",
    lookFor: [
      "No edge whitening whatsoever",
      "No surface scratches or scuffs",
      "Corners are sharp and intact",
      "No bends, creases, or dents",
      "Print is clean with no smudging",
    ],
    priceImpact: "Full market price (100%)",
    playability: "Tournament legal \u2014 no sleeves required for condition.",
    edgeWear: "None",
    surface: "Clean",
    creasing: "None",
    typicalPricePct: "100%",
  },
  {
    abbr: "LP",
    name: "Lightly Played",
    icon: "\ud83d\udc4d",
    color: "bg-lime-500",
    colorHex: "#84cc16",
    description:
      "Minor wear visible on close inspection. Slight edge whitening, very minor surface scratches. Card is still in great shape.",
    lookFor: [
      "Slight edge whitening on one or two edges",
      "Very minor surface scratches visible under light",
      "Corners may show minimal rounding",
      "No creasing or bends",
      "Card face is still vibrant and clean",
    ],
    priceImpact: "Typically 80\u201390% of NM price",
    playability: "Tournament legal \u2014 opaque sleeves recommended.",
    edgeWear: "Slight",
    surface: "Minor scratches",
    creasing: "None",
    typicalPricePct: "80\u201390%",
  },
  {
    abbr: "MP",
    name: "Moderately Played",
    icon: "\ud83d\udd0d",
    color: "bg-yellow-500",
    colorHex: "#eab308",
    description:
      "Noticeable wear. Edge whitening, minor creasing, light scratches visible. Card is fully playable but shows clear use.",
    lookFor: [
      "Moderate edge whitening on multiple edges",
      "Light scratches visible without close inspection",
      "Minor creasing or small bends",
      "Slight corner wear or dings",
      "Print may show minor fading",
    ],
    priceImpact: "Typically 60\u201370% of NM price",
    playability: "Tournament legal in opaque sleeves.",
    edgeWear: "Moderate",
    surface: "Light scratches",
    creasing: "Minor",
    typicalPricePct: "60\u201370%",
  },
  {
    abbr: "HP",
    name: "Heavily Played",
    icon: "\u26a0\ufe0f",
    color: "bg-orange-500",
    colorHex: "#f97316",
    description:
      "Significant wear. Heavy whitening, creases, scuffs, or bends. Card is playable but heavily used.",
    lookFor: [
      "Heavy edge whitening across all edges",
      "Visible creases or fold marks",
      "Surface scuffs or scratches noticeable at a glance",
      "Corners may be rounded or dinged",
      "Card may have slight warping",
    ],
    priceImpact: "Typically 40\u201350% of NM price",
    playability: "Playable in opaque sleeves \u2014 may draw judge attention in tournaments.",
    edgeWear: "Heavy",
    surface: "Scuffs / scratches",
    creasing: "Visible creases",
    typicalPricePct: "40\u201350%",
  },
  {
    abbr: "DMG",
    name: "Damaged",
    icon: "\ud83d\udeab",
    color: "bg-red-500",
    colorHex: "#ef4444",
    description:
      "Major damage. Large creases, tears, water damage, writing, or missing pieces. Card may not be tournament legal.",
    lookFor: [
      "Large creases, tears, or rips",
      "Water damage or staining",
      "Writing, ink marks, or stickers",
      "Pieces of the card missing or peeling",
      "Severe warping or structural damage",
    ],
    priceImpact: "Typically 10\u201330% of NM price",
    playability: "May NOT be tournament legal \u2014 best for casual play or collecting.",
    edgeWear: "Severe",
    surface: "Major damage",
    creasing: "Large creases / tears",
    typicalPricePct: "10\u201330%",
  },
];

const TIPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Always sleeve your cards",
    text: "Use inner sleeves for double-sleeving valuable cards. This prevents surface scratches and edge wear during play and storage.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: "Use top-loaders for shipping",
    text: "Top-loaders protect cards from bending during transit. Pair with a penny sleeve inside for maximum protection.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: "Store in a cool, dry place",
    text: "Humidity and heat can warp cards and cause foil peeling. Keep your collection away from direct sunlight and moisture.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Check condition under good lighting",
    text: "Use bright, even lighting when inspecting cards. Angling the card under light reveals surface scratches and creases that are otherwise hard to spot.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ConditionGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ---------- Header ---------- */}
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
        Card Condition Guide
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-4 text-lg max-w-3xl">
        Understanding card condition is essential when buying and selling TCG singles. This guide
        covers the industry-standard grading scale used across platforms like TCGPlayer, so you
        know exactly what to expect from every purchase.
      </p>

      {/* Gradient bar legend */}
      <div className="mb-10">
        <div
          className="h-3 rounded-full w-full max-w-md"
          style={{
            background: `linear-gradient(to right, ${CONDITIONS.map((c) => c.colorHex).join(", ")})`,
          }}
        />
        <div className="flex justify-between max-w-md text-xs text-[var(--color-text-muted)] mt-1">
          <span>Near Mint</span>
          <span>Damaged</span>
        </div>
      </div>

      {/* ---------- Condition sections ---------- */}
      <div className="space-y-8 mb-16">
        {CONDITIONS.map((c) => (
          <section
            key={c.abbr}
            id={c.abbr.toLowerCase()}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden"
          >
            {/* Color bar */}
            <div className={`h-1.5 ${c.color}`} />

            <div className="p-5 sm:p-6">
              {/* Title row */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" role="img" aria-label={c.name}>
                  {c.icon}
                </span>
                <div>
                  <h2 className="text-xl font-bold leading-tight">
                    {c.name}{" "}
                    <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                      ({c.abbr})
                    </span>
                  </h2>
                </div>
              </div>

              <p className="text-[var(--color-text-secondary)] mb-4">{c.description}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* What to look for */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">What to look for</h3>
                  <ul className="space-y-1.5">
                    {c.lookFor.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                        <svg
                          className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-accent)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta info */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                      Price Impact
                    </h3>
                    <p className="text-sm font-medium">{c.priceImpact}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                      Tournament Playability
                    </h3>
                    <p className="text-sm font-medium">{c.playability}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ---------- Comparison Table ---------- */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4">Condition Comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)]">
                <th className="text-left px-4 py-3 font-semibold">Grade</th>
                <th className="text-left px-4 py-3 font-semibold">Edge Wear</th>
                <th className="text-left px-4 py-3 font-semibold">Surface</th>
                <th className="text-left px-4 py-3 font-semibold">Creasing</th>
                <th className="text-left px-4 py-3 font-semibold">Playability</th>
                <th className="text-left px-4 py-3 font-semibold">Typical Price</th>
              </tr>
            </thead>
            <tbody>
              {CONDITIONS.map((c, i) => (
                <tr
                  key={c.abbr}
                  className={
                    i % 2 === 0
                      ? "bg-[var(--color-bg-card)]"
                      : "bg-[var(--color-bg-secondary)]"
                  }
                >
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${c.color}`}
                      />
                      {c.abbr}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{c.edgeWear}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{c.surface}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{c.creasing}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {c.abbr === "DMG" ? "May not be legal" : "Legal"}
                  </td>
                  <td className="px-4 py-3 font-medium">{c.typicalPricePct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Tips Section ---------- */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Card Care Tips</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {TIPS.map((tip) => (
            <div
              key={tip.title}
              className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
            >
              <div className="flex items-center gap-2 mb-2 text-[var(--color-accent)]">
                {tip.icon}
                <h3 className="font-semibold text-[var(--color-text)]">{tip.title}</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">{tip.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <div className="text-center p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <h2 className="text-xl font-bold mb-2">Ready to shop?</h2>
        <p className="text-[var(--color-text-secondary)] mb-4 text-sm max-w-lg mx-auto">
          Every card we sell is hand-inspected and accurately graded. Browse our inventory with confidence.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Browse Cards
          </Link>
          <Link
            href="/about#grading"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Our Grading Standards
          </Link>
        </div>
      </div>
    </div>
  );
}
