"use client";

import { useState, useEffect, useCallback } from "react";

interface Review {
  id: string;
  product_type: string;
  product_slug: string;
  product_name: string;
  customer_name: string;
  rating: number;
  title: string;
  body: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

interface ReviewSectionProps {
  productSlug: string;
  productName: string;
  productType: "card" | "accessory";
}

function StarRating({ rating, size = 16, interactive = false, onChange }: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={(hover || rating) >= star ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
            className={(hover || rating) >= star ? "text-yellow-400" : "text-[var(--color-text-muted)]"}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function ReviewSection({ productSlug, productName, productType }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [helpedIds, setHelpedIds] = useState<Set<string>>(new Set());

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formError, setFormError] = useState("");

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?slug=${productSlug}&type=${productType}`);
      const data = await res.json();
      if (data.success) setReviews(data.reviews || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [productSlug, productType]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Try to auto-fill name/email from logged-in customer
  useEffect(() => {
    fetch("/api/customer/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.customer) {
          setFormName(data.customer.name);
          setFormEmail(data.customer.email);
        }
      })
      .catch(() => {});
  }, []);

  // Calculate stats
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => { ratingCounts[r.rating - 1]++; });

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (formRating === 0) { setFormError("Please select a rating"); return; }
    if (!formName.trim()) { setFormError("Please enter your name"); return; }
    if (!formEmail.trim()) { setFormError("Please enter your email"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug,
          productName,
          productType,
          rating: formRating,
          title: formTitle,
          body: formBody,
          customerName: formName,
          customerEmail: formEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setShowForm(false);
        // Reset form
        setFormRating(0);
        setFormTitle("");
        setFormBody("");
      } else {
        setFormError(data.error || "Failed to submit review");
      }
    } catch {
      setFormError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Mark helpful
  const handleHelpful = async (reviewId: string) => {
    if (helpedIds.has(reviewId)) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setHelpedIds((prev) => new Set(prev).add(reviewId));
        setReviews((prev) =>
          prev.map((r) => r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r)
        );
      }
    } catch {
      // silent fail
    }
  };

  return (
    <section className="mt-12 border-t border-[var(--color-border)] pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(avgRating)} size={18} />
              <span className="text-sm font-medium text-[var(--color-text)]">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-[var(--color-text-muted)]">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating breakdown */}
      {reviews.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Average */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-[var(--color-text)]">{avgRating.toFixed(1)}</span>
              <StarRating rating={Math.round(avgRating)} size={20} />
              <span className="text-sm text-[var(--color-text-muted)] mt-1">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
            {/* Bars */}
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-muted)] w-3">{star}</span>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400 flex-shrink-0">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${reviews.length > 0 ? (ratingCounts[star - 1] / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] w-6 text-right">
                    {ratingCounts[star - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success message after submit */}
      {submitted && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] text-sm">
          Thank you for your review! It will be visible after approval.
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)] mb-4">Write Your Review</h3>

          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Rating *
            </label>
            <StarRating rating={formRating} size={28} interactive onChange={setFormRating} />
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email *</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              placeholder="Summarize your experience"
            />
          </div>

          {/* Body */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Review</label>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] resize-y"
              placeholder="Tell others about your experience with this product..."
            />
          </div>

          {formError && (
            <p className="text-sm text-[var(--color-danger)] mb-3">{formError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-[var(--color-border)] skeleton h-32" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <p className="text-[var(--color-text-secondary)] font-medium">No reviews yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Be the first to review this product!</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size={14} />
                    {review.title && (
                      <span className="font-semibold text-sm text-[var(--color-text)]">
                        {review.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {review.customer_name}
                    </span>
                    {review.verified_purchase && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {timeAgo(review.created_at)}
                </span>
              </div>

              {/* Body */}
              {review.body && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                  {review.body}
                </p>
              )}

              {/* Helpful */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => handleHelpful(review.id)}
                  disabled={helpedIds.has(review.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    helpedIds.has(review.id)
                      ? "text-[var(--color-primary)] cursor-default"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                  </svg>
                  Helpful ({review.helpful_count})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
