"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getCart,
  removeFromCart,
  updateQuantity,
  getCartSubtotal,
  getShippingCost,
  getAppliedCoupon,
  applyCoupon,
  removeCoupon,
} from "@/lib/cart";
import { CONDITION_SHORT } from "@/lib/types";
import type { CartItem, Coupon } from "@/lib/types";

export default function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  const refreshCart = () => {
    setItems(getCart());
    setCoupon(getAppliedCoupon());
  };

  useEffect(() => {
    setMounted(true);
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, []);

  useEffect(() => {
    if (isOpen) refreshCart();
  }, [isOpen]);

  const subtotal = getCartSubtotal();
  const shipping = getShippingCost();
  const discount = coupon
    ? coupon.type === "percentage"
      ? subtotal * (coupon.value / 100)
      : Math.min(coupon.value, subtotal)
    : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput);
    setCouponMessage(result.message);
    if (result.success) {
      setCoupon(result.coupon || null);
      setCouponInput("");
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--color-bg)] shadow-xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold">Shopping Cart ({items.length})</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-[var(--color-text-secondary)]">Your cart is empty</p>
                <button onClick={onClose} className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.inventoryId} className="flex gap-3 p-3 rounded-lg border border-[var(--color-border)]">
                    <div className="w-16 h-24 relative flex-shrink-0 rounded overflow-hidden bg-[var(--color-bg-secondary)]">
                      <Image
                        src={item.imageUrl || "/placeholder-card.png"}
                        alt={item.cardName}
                        fill
                        className="object-contain"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.cardName}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {item.setCode} &middot; {CONDITION_SHORT[item.condition]} &middot; {item.edition}
                      </p>
                      <p className="font-semibold text-sm mt-1">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded border border-[var(--color-border)] text-xs hover:bg-[var(--color-bg-secondary)]"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxQuantity}
                          className="w-6 h-6 flex items-center justify-center rounded border border-[var(--color-border)] text-xs hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.inventoryId)}
                          className="ml-auto text-xs text-[var(--color-danger)] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-3">
              {/* Coupon */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-xs ${coupon ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  {couponMessage}
                </p>
              )}
              {coupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-success)]">Coupon: {coupon.code}</span>
                  <button onClick={() => { removeCoupon(); setCoupon(null); setCouponMessage(""); }} className="text-xs text-[var(--color-danger)] hover:underline">
                    Remove
                  </button>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[var(--color-success)]">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Shipping</span>
                  <span>{shipping === 0 ? <span className="text-[var(--color-success)]">FREE</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping > 0 && subtotal < 25 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Add ${(25 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-[var(--color-border)]">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full py-3 text-center text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg transition-colors"
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={onClose}
                className="block w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
