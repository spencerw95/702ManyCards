"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getCart,
  getCartSubtotal,
  getShippingCost,
  getCartTotal,
  getAppliedCoupon,
  clearCart,
} from "@/lib/cart";
import { CONDITION_SHORT } from "@/lib/types";
import type { CartItem, Coupon } from "@/lib/types";

interface ShippingForm {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: "US" | "CA";
  notes: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<ShippingForm>({
    fullName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    notes: "",
  });

  useEffect(() => {
    setCart(getCart());
    setSubtotal(getCartSubtotal());
    setShipping(getShippingCost());
    setTotal(getCartTotal());
    setCoupon(getAppliedCoupon());
  }, []);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email.";
    }
    if (!form.address1.trim()) errs.address1 = "Address is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.state.trim()) errs.state = "State / Province is required.";
    if (!form.zip.trim()) errs.zip = "ZIP / Postal code is required.";
    return errs;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const id = `702-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setOrderNumber(id);
    setOrderPlaced(true);
    clearCart();
    setCart([]);
  }

  function updateField(field: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const discount =
    coupon && subtotal > 0
      ? coupon.type === "percentage"
        ? subtotal * (coupon.value / 100)
        : Math.min(coupon.value, subtotal)
      : 0;

  // Order placed confirmation
  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold mb-3">Order Confirmed!</h1>
        <p className="text-[var(--color-text-secondary)] mb-2">
          Thank you for your order. We will send a confirmation to your email shortly.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Order Number: <span className="font-mono font-semibold text-[var(--color-text)]">{orderNumber}</span>
        </p>
        <Link
          href="/search"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Add some cards to your cart before checking out.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Browse Cards
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Shipping Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <h2 className="text-lg font-bold mb-5">Shipping Information</h2>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
                    Full Name <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                      errors.fullName ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.fullName}</p>}
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                      Email <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                        errors.email ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                      }`}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                      Phone <span className="text-[var(--color-text-muted)]">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                      placeholder="(702) 555-1234"
                    />
                  </div>
                </div>

                {/* Address Line 1 */}
                <div>
                  <label htmlFor="address1" className="block text-sm font-medium mb-1.5">
                    Address Line 1 <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    id="address1"
                    type="text"
                    value={form.address1}
                    onChange={(e) => updateField("address1", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                      errors.address1 ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                    }`}
                    placeholder="123 Main St"
                  />
                  {errors.address1 && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.address1}</p>}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label htmlFor="address2" className="block text-sm font-medium mb-1.5">
                    Address Line 2 <span className="text-[var(--color-text-muted)]">(optional)</span>
                  </label>
                  <input
                    id="address2"
                    type="text"
                    value={form.address2}
                    onChange={(e) => updateField("address2", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                    placeholder="Apt, suite, unit, etc."
                  />
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="city" className="block text-sm font-medium mb-1.5">
                      City <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                        errors.city ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                      }`}
                      placeholder="Las Vegas"
                    />
                    {errors.city && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-1.5">
                      State / Province <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={form.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                        errors.state ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                      }`}
                      placeholder="NV"
                    />
                    {errors.state && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.state}</p>}
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium mb-1.5">
                      ZIP / Postal Code <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      id="zip"
                      type="text"
                      value={form.zip}
                      onChange={(e) => updateField("zip", e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                        errors.zip ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                      }`}
                      placeholder="89101"
                    />
                    {errors.zip && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.zip}</p>}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium mb-1.5">
                    Country
                  </label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1.5">
                    Order Notes <span className="text-[var(--color-text-muted)]">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors resize-vertical"
                    placeholder="Any special instructions or requests..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] sticky top-24">
              <h2 className="text-lg font-bold mb-5">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-5 max-h-80 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.inventoryId} className="flex gap-3">
                    <div className="w-12 h-[66px] relative rounded overflow-hidden bg-[var(--color-bg-secondary)] shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.cardName}
                        fill
                        className="object-contain"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.cardName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {item.setCode} &middot; {CONDITION_SHORT[item.condition]} &middot; Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[var(--color-border)] pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && coupon && (
                  <div className="flex justify-between text-[var(--color-success)]">
                    <span>Discount ({coupon.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-[var(--color-success)]">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-base font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                className="mt-6 w-full py-3 rounded-lg text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:ring-offset-2"
              >
                Place Order
              </button>

              <p className="mt-3 text-xs text-center text-[var(--color-text-muted)]">
                By placing your order you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
