"use client";

/**
 * RarityCardWrapper
 * Wraps a card image and applies the correct CSS holographic effect
 * based on the card's rarity string, plus interactive 3D tilt and
 * mouse-tracking spotlight.
 *
 * Usage:
 *   <RarityCardWrapper rarity={item.rarity}>
 *     <Image ... />
 *   </RarityCardWrapper>
 */

import { useRef, useState, useCallback } from "react";

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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  // No interactive effects for common cards
  const hasEffect = effectClass !== "";

  // Max tilt: gentler for thumbnails, more for detail
  const maxTilt = detail ? 10 : 5;

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!hasEffect || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      // Normalized 0-1 position within the element
      const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      // Tilt: centered at 0.5, range [-maxTilt, maxTilt]
      // rotateY for horizontal movement, rotateX (inverted) for vertical
      const tiltY = (nx - 0.5) * 2 * maxTilt;
      const tiltX = -(ny - 0.5) * 2 * maxTilt;

      setTilt({ x: tiltX, y: tiltY });
      setMousePos({ x: nx * 100, y: ny * 100 });
    },
    [hasEffect, maxTilt]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleMove]
  );

  const handleEnter = useCallback(() => {
    if (hasEffect) setIsHovering(true);
  }, [hasEffect]);

  const handleLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
  }, []);

  const transformStyle = hasEffect
    ? {
        transform: isHovering
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)",
        transition: isHovering
          ? "transform 0.1s ease-out"
          : "transform 0.4s ease-out",
        "--mouse-x": `${mousePos.x}%`,
        "--mouse-y": `${mousePos.y}%`,
      } as React.CSSProperties
    : undefined;

  return (
    <div
      ref={ref}
      data-rarity={rarity}
      className={`rarity-wrapper ${effectClass} ${detail ? "rarity-wrapper--detail" : ""} ${className}`.trim()}
      style={transformStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
    >
      {children}
    </div>
  );
}
