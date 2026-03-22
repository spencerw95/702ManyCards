"use client";

import type { RecentlyViewedCard } from "./types";

const RECENTLY_VIEWED_KEY = "702mc_recent";
const MAX_ITEMS = 10;

function getStored(): RecentlyViewedCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: RecentlyViewedCard[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
}

export function addRecentlyViewed(card: Omit<RecentlyViewedCard, "viewedAt">): void {
  const list = getStored().filter((i) => i.cardName !== card.cardName);
  list.unshift({ ...card, viewedAt: new Date().toISOString() });
  save(list.slice(0, MAX_ITEMS));
}

export function getRecentlyViewed(limit: number = MAX_ITEMS): RecentlyViewedCard[] {
  return getStored().slice(0, limit);
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
}
