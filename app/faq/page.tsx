"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How are cards graded?",
    answer: (
      <>
        We use industry-standard condition grades: Near Mint (NM), Lightly Played (LP),
        Moderately Played (MP), Heavily Played (HP), and Damaged (DMG). Every card is
        hand-inspected before listing. For full descriptions of each grade, visit our{" "}
        <Link href="/condition-guide" className="text-[var(--color-primary)] hover:underline font-medium">
          Card Condition Guide
        </Link>
        .
      </>
    ),
  },
  {
    question: "What payment methods do you accept?",
    answer: (
      <>
        Orders are currently placed through our order form and payments are coordinated
        directly. We are working on integrating Shopify payments which will support credit
        cards, debit cards, Apple Pay, Google Pay, and more. Stay tuned!
      </>
    ),
  },
  {
    question: "How long does shipping take?",
    answer: (
      <>
        Orders within the <strong>United States</strong> typically arrive in 3&ndash;5 business
        days. Orders to <strong>Canada</strong> usually take 7&ndash;14 business days. Orders
        are processed within 1&ndash;2 business days of confirmation.
      </>
    ),
  },
  {
    question: "Do you ship internationally?",
    answer: (
      <>
        We currently ship to the <strong>United States</strong> and <strong>Canada</strong> only.
        We hope to expand to more countries in the future.
      </>
    ),
  },
  {
    question: "What's your return policy?",
    answer: (
      <>
        We accept returns within <strong>7 days</strong> of delivery. Cards must be returned in
        the same condition they were received, and the buyer is responsible for return shipping
        costs. Refunds are issued once the return is received and verified. See our{" "}
        <Link href="/about" className="text-[var(--color-primary)] hover:underline font-medium">
          About page
        </Link>{" "}
        for full details.
      </>
    ),
  },
  {
    question: "Can I request specific cards?",
    answer: (
      <>
        Absolutely! If you are looking for a specific card that is not currently in our
        inventory, use our{" "}
        <Link href="/contact" className="text-[var(--color-primary)] hover:underline font-medium">
          contact form
        </Link>{" "}
        with the subject &ldquo;Card Request&rdquo; and we will do our best to source it for
        you.
      </>
    ),
  },
  {
    question: "How do I track my order?",
    answer: (
      <>
        For orders of <strong>$25 or more</strong>, tracking information is provided via email
        once your package ships. Orders under $25 are sent via plain white envelope (PWE) which
        does not include tracking.
      </>
    ),
  },
  {
    question: "Do you offer bulk deals?",
    answer: (
      <>
        Yes! If you are interested in purchasing <strong>10 or more cards</strong>, reach out
        through our{" "}
        <Link href="/contact" className="text-[var(--color-primary)] hover:underline font-medium">
          contact form
        </Link>{" "}
        and we will work out a deal for you.
      </>
    ),
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Frequently Asked Questions</h1>
      <p className="text-[var(--color-text-secondary)] mb-10 text-lg">
        Got questions? We have answers. If you do not see what you are looking for,{" "}
        <Link href="/contact" className="text-[var(--color-primary)] hover:underline font-medium">
          contact us
        </Link>
        .
      </p>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <span>{item.question}</span>
                <svg
                  className={`w-5 h-5 text-[var(--color-text-muted)] shrink-0 ml-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
