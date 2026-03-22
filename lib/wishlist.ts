"use client";

import type { WishlistItem } from "./types";

const WISHLIST_KEY = "702mc_wishlist";

function getStoredWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("wishlist-updated"));
}

export function getWishlist(): WishlistItem[] {
  return getStoredWishlist();
}

export function addToWishlist(card: Omit<WishlistItem, "addedAt">): WishlistItem[] {
  const list = getStoredWishlist();
  if (list.some((i) => i.cardName === card.cardName)) return list;

  list.push({ ...card, addedAt: new Date().toISOString() });
  saveWishlist(list);
  return list;
}

export function removeFromWishlist(cardName: string): WishlistItem[] {
  const list = getStoredWishlist().filter((i) => i.cardName !== cardName);
  saveWishlist(list);
  return list;
}

export function isInWishlist(cardName: string): boolean {
  return getStoredWishlist().some((i) => i.cardName === cardName);
}

export function toggleWishlist(card: Omit<WishlistItem, "addedAt">): boolean {
  if (isInWishlist(card.cardName)) {
    removeFromWishlist(card.cardName);
    return false;
  } else {
    addToWishlist(card);
    return true;
  }
}
