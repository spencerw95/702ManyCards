"use client";

import { useRef, useCallback } from "react";

/**
 * RarityCardWrapper
 * Wraps a card image and applies:
 * 1. CSS holographic effect based on rarity (on hover only)
 * 2. Interactive 3D tilt that follows the mouse
 */

interface RarityCardWrapperProps {
  rarity: string;
  children: React.ReactNode;
  className?: string;
  /** Use the detail-page variant with more pronounced effects */
  detail?: boolean;
}

/**
 * Maps a rarity string to the CSS effect class defined in rarity-effects.css.
 * Returns empty string for commons / unknown rarities (no effect).
 */
function getRarityClass(rarity: string): string {
  const r = rarity.toLowerCase().trim();

  // ---------- No effect ----------
  if (r === "common" || r === "short print") return "";

  // ---------- Subtle shimmer ----------
  if (r === "rare" || r === "uncommon") return "rarity-subtle-shimmer";

  // ---------- ACE SPEC (check before generic "rare") ----------
  if (r.includes("ace spec")) return "rarity-ace";

  // ---------- Platinum ----------
  if (r.includes("platinum")) return "rarity-platinum";

  // ---------- Double Rare ----------
  if (r === "double rare") return "rarity-double";

  // ---------- Prismatic Sparkle ----------
  if (
    r.includes("starlight") ||
    r.includes("special illustration") ||
    r.includes("illustration rare") ||
    r === "hyper rare" ||
    r.includes("collector's rare") ||
    r.includes("collectors rare")
  ) {
    return "rarity-prismatic";
  }

  // ---------- Secret Rainbow ----------
  if (r.includes("secret")) return "rarity-secret";

  // ---------- Ghost ----------
  if (r.includes("ghost")) return "rarity-ghost";

  // ---------- Ultimate ----------
  if (r.includes("ultimate")) return "rarity-embossed";

  // ---------- Mythic ----------
  if (r.includes("mythic")) return "rarity-mythic";

  // ---------- Gold Foil ----------
  if (
    r.includes("ultra rare") ||
    r.includes("rare ultra") ||
    r.includes("gold rare") ||
    r.includes("gold secret") ||
    r.includes("premium gold")
  ) {
    return "rarity-gold";
  }

  // ---------- Holographic Art ----------
  if (
    r.includes("super rare") ||
    r.includes("rare holo") ||
    r.includes("shiny rare") ||
    r.includes("starfoil") ||
    r.includes("shatterfoil") ||
    r.includes("mosaic") ||
    r.includes("parallel")
  ) {
    return "rarity-holo";
  }

  // ---------- Fallback: no effect ----------
  return "";
}

export default function RarityCardWrapper({
  rarity,
  children,
  className = "",
  detail = false,
}: RarityCardWrapperProps) {
  const effectClass = getRarityClass(rarity);
  const ref = useRef<HTMLDivElement>(null);
  const maxTilt = detail ? 10 : 6;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0-1
      const y = (e.clientY - rect.top) / rect.height; // 0-1
      const rotateY = (x - 0.5) * maxTilt * 2; // -maxTilt to +maxTilt
      const rotateX = (0.5 - y) * maxTilt * 2;
      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    },
    [maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
  }, []);

  return (
    <div
      ref={ref}
      data-rarity={rarity}
      className={`rarity-wrapper ${effectClass} ${detail ? "rarity-wrapper--detail" : ""} ${className}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
