"use client";

import type { CartItem, Coupon } from "./types";

const CART_KEY = "702mc_cart";
const COUPON_KEY = "702mc_coupon";
const FREE_SHIPPING_THRESHOLD = 25;

function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function getCart(): CartItem[] {
  return getStoredCart();
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getStoredCart();
  const existing = cart.find((i) => i.inventoryId === item.inventoryId);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, item.maxQuantity);
  } else {
    cart.push({ ...item });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(inventoryId: string): CartItem[] {
  const cart = getStoredCart().filter((i) => i.inventoryId !== inventoryId);
  saveCart(cart);
  return cart;
}

export function updateQuantity(inventoryId: string, quantity: number): CartItem[] {
  const cart = getStoredCart();
  const item = cart.find((i) => i.inventoryId === inventoryId);
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(inventoryId);
    }
    item.quantity = Math.min(quantity, item.maxQuantity);
  }
  saveCart(cart);
  return cart;
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(COUPON_KEY);
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function getCartCount(): number {
  return getStoredCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(): number {
  return getStoredCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getShippingCost(): number {
  const subtotal = getCartSubtotal();
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 4.99;
}

export function getCartTotal(): number {
  const subtotal = getCartSubtotal();
  const shipping = getShippingCost();
  const coupon = getAppliedCoupon();
  let discount = 0;

  if (coupon) {
    if (coupon.type === "percentage") {
      discount = subtotal * (coupon.value / 100);
    } else {
      discount = Math.min(coupon.value, subtotal);
    }
  }

  return Math.max(0, subtotal - discount + shipping);
}

// ===== Coupon Functions =====

// Demo coupons — in production these would come from a database
const VALID_COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percentage", value: 10, minOrder: 10, usedCount: 0 },
  { code: "SAVE5", type: "fixed", value: 5, minOrder: 25, usedCount: 0 },
];

export function applyCoupon(code: string): { success: boolean; message: string; coupon?: Coupon } {
  const coupon = VALID_COUPONS.find((c) => c.code.toLowerCase() === code.toLowerCase());

  if (!coupon) {
    return { success: false, message: "Invalid coupon code." };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { success: false, message: "This coupon has expired." };
  }

  const subtotal = getCartSubtotal();
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return { success: false, message: `Minimum order of $${coupon.minOrder} required.` };
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }

  const discountText = coupon.type === "percentage" ? `${coupon.value}%` : `$${coupon.value}`;
  return { success: true, message: `Coupon applied! ${discountText} off.`, coupon };
}

export function removeCoupon(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COUPON_KEY);
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function getAppliedCoupon(): Coupon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
