// Custom analytics events for 702ManyCards
// Uses Vercel Analytics custom events under the hood

import { track } from "@vercel/analytics";

// ===== Card Events =====

export function trackCardView(cardName: string, game: string, price: number) {
  track("card_view", { cardName, game, price: price.toString() });
}

export function trackAddToCart(cardName: string, game: string, price: number, condition: string) {
  track("add_to_cart", {
    cardName,
    game,
    price: price.toString(),
    condition,
  });
}

export function trackRemoveFromCart(cardName: string) {
  track("remove_from_cart", { cardName });
}

// ===== Search Events =====

export function trackSearch(query: string, game: string, resultCount: number) {
  track("search", {
    query,
    game: game || "all",
    resultCount: resultCount.toString(),
  });
}

export function trackFilterUsed(filterType: string, filterValue: string) {
  track("filter_used", { filterType, filterValue });
}

// ===== Checkout Events =====

export function trackCheckoutStarted(itemCount: number, total: number) {
  track("checkout_started", {
    itemCount: itemCount.toString(),
    total: total.toString(),
  });
}

export function trackPurchaseComplete(orderId: string, total: number, itemCount: number) {
  track("purchase_complete", {
    orderId,
    total: total.toString(),
    itemCount: itemCount.toString(),
  });
}

// ===== Accessory Events =====

export function trackAccessoryView(productName: string, category: string, price: number) {
  track("accessory_view", {
    productName,
    category,
    price: price.toString(),
  });
}

// ===== Sell Your Cards Events =====

export function trackSellSubmission(cardCount: number, game: string) {
  track("sell_submission", {
    cardCount: cardCount.toString(),
    game,
  });
}

// ===== Account Events =====

export function trackSignUp() {
  track("sign_up");
}

export function trackSignIn() {
  track("sign_in");
}

export function trackWishlistAdd(cardName: string) {
  track("wishlist_add", { cardName });
}

export function trackWishlistRemove(cardName: string) {
  track("wishlist_remove", { cardName });
}
