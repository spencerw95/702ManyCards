"use client";

import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart";

export default function CartIcon({ onClick }: { onClick: () => void }) {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(getCartCount());

    const handleUpdate = () => setCount(getCartCount());
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
      aria-label={`Shopping cart${mounted && count > 0 ? `, ${count} items` : ""}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {mounted && count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-[var(--color-primary)] rounded-full">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
