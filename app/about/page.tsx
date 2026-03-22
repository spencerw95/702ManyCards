import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2">About 702ManyCards</h1>
      <p className="text-[var(--color-text-secondary)] mb-10 text-lg">
        Premium Yu-Gi-Oh singles from a passionate collector.
      </p>

      {/* Our Story */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <div className="prose max-w-none text-[var(--color-text-secondary)] space-y-4">
          <p>
            702ManyCards was born out of a lifelong passion for Yu-Gi-Oh. What started as a
            personal collection has grown into a trusted source for premium singles. Based in
            Las Vegas, Nevada (the 702 area code), we take pride in offering competitively
            priced cards that are carefully inspected, accurately graded, and securely shipped
            to duelists across the US and Canada.
          </p>
          <p>
            Every card in our inventory is hand-checked for condition accuracy so you know
            exactly what you are getting. We believe in transparency, fair prices backed by
            TCGPlayer market data, and the kind of customer service you would expect from a
            fellow collector &mdash; not a faceless warehouse.
          </p>
        </div>
      </section>

      {/* Grading Standards */}
      <section id="grading" className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Grading Standards</h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          We use industry-standard condition grades so there are no surprises when your cards arrive.
        </p>
        <div className="space-y-4">
          {GRADES.map((grade) => (
            <div
              key={grade.short}
              className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]"
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="inline-flex items-center justify-center w-12 h-7 rounded text-xs font-bold bg-[var(--color-primary)] text-white">
                  {grade.short}
                </span>
                <h3 className="font-semibold text-base">{grade.label}</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] ml-15 pl-[60px]">
                {grade.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Shipping Info */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Shipping Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="font-semibold">Under $25</h3>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Shipped in a plain white envelope (PWE) with top-loader protection. Standard
              shipping fee of $4.99.
            </p>
          </div>
          <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="font-semibold">$25 and Over</h3>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Free tracked shipping in a bubble mailer with tracking number provided via email.
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 rounded-lg bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]">
          <p>
            <strong className="text-[var(--color-text)]">Destinations:</strong> We currently
            ship to the United States and Canada. Delivery typically takes 3&ndash;5 business
            days within the US and 7&ndash;14 business days to Canada.
          </p>
        </div>
      </section>

      {/* Return Policy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Return Policy</h2>
        <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-3 text-sm text-[var(--color-text-secondary)]">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-[var(--color-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Returns are accepted within <strong className="text-[var(--color-text)]">7 days</strong> of delivery.
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-[var(--color-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Cards must be returned in the same condition they were received.
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-[var(--color-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Buyer pays return shipping costs.
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-[var(--color-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Refunds are issued once we receive and verify the returned card(s).
            </li>
          </ul>
          <p className="pt-2">
            If you have any issues with your order, please{" "}
            <Link href="/contact" className="text-[var(--color-primary)] hover:underline font-medium">
              contact us
            </Link>{" "}
            and we will make it right.
          </p>
        </div>
      </section>
    </div>
  );
}

const GRADES = [
  {
    short: "NM",
    label: "Near Mint",
    description:
      "Card is in excellent condition with minimal to no wear. May have very slight edge whitening only visible under close inspection. Looks essentially new.",
  },
  {
    short: "LP",
    label: "Lightly Played",
    description:
      "Minor wear visible on close inspection. May include slight edge whitening, a small scratch, or minor corner wear. Card is still in great overall shape.",
  },
  {
    short: "MP",
    label: "Moderately Played",
    description:
      "Noticeable wear that is visible at arm's length. May include moderate edge whitening, surface scratches, or slight creasing. Card is still fully playable in sleeves.",
  },
  {
    short: "HP",
    label: "Heavily Played",
    description:
      "Significant wear including heavy edge whitening, creases, or surface damage. Card is playable in opaque sleeves but shows clear signs of heavy use.",
  },
  {
    short: "DMG",
    label: "Damaged",
    description:
      "Severe damage such as tears, heavy creasing, water damage, or writing on the card. Typically only suitable for casual play or as a placeholder.",
  },
];
