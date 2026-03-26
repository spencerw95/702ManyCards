"use client";

import React, { useState, useEffect, useCallback } from "react";

type ReviewStatus = "pending" | "approved" | "rejected";

interface Review {
  id: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  createdAt: string;
}

const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const FILTER_TABS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      const raw: Record<string, unknown>[] = Array.isArray(data.reviews) ? data.reviews : [];
      setReviews(raw.map((r) => ({
        id: r.id as string,
        productName: (r.product_name as string) || "",
        customerName: (r.customer_name as string) || "",
        customerEmail: (r.customer_email as string) || "",
        rating: (r.rating as number) || 0,
        title: (r.title as string) || "",
        body: (r.body as string) || "",
        status: (r.status as ReviewStatus) || "pending",
        createdAt: (r.created_at as string) || "",
      })));
    } catch {
      // fail silently
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateReviewStatus = async (reviewId: string, newStatus: ReviewStatus) => {
    setUpdatingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, status: newStatus } : r
          )
        );
      }
    } catch {
      // fail silently
    }
    setUpdatingId(null);
  };

  const filtered =
    filterStatus === "all"
      ? reviews
      : reviews.filter((r) => r.status === filterStatus);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-96 rounded-[var(--radius-lg)] skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">
            {reviews.length} total review{reviews.length !== 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)] rounded-[var(--radius-lg)] p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`
              px-4 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-colors cursor-pointer
              ${filterStatus === tab.value
                ? "bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }
            `}
          >
            {tab.label}
            {tab.value === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Rating</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sorted.map((review) => (
                <React.Fragment key={review.id}>
                  <tr
                    className="hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === review.id ? null : review.id)
                    }
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text)] max-w-[200px] truncate">
                      {review.productName}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {review.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell max-w-xs truncate">
                      {review.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[review.status]}`}
                      >
                        {STATUS_LABELS[review.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell whitespace-nowrap">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(
                            expandedId === review.id ? null : review.id
                          );
                        }}
                        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {expandedId === review.id ? "Close" : "View"}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedId === review.id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-[var(--color-bg-secondary)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Review Content */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                                Review Details
                              </h4>
                              <div className="text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[var(--color-text-muted)]">Rating:</span>
                                  <StarRating rating={review.rating} />
                                  <span className="text-[var(--color-text-secondary)]">
                                    ({review.rating}/5)
                                  </span>
                                </div>
                                <p>
                                  <span className="text-[var(--color-text-muted)]">Title:</span>{" "}
                                  <span className="font-medium text-[var(--color-text)]">{review.title}</span>
                                </p>
                                <p>
                                  <span className="text-[var(--color-text-muted)]">Product:</span>{" "}
                                  {review.productName}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                                Review Body
                              </h4>
                              <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2 whitespace-pre-wrap">
                                {review.body}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                                Customer Info
                              </h4>
                              <div className="text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2 space-y-1">
                                <p>
                                  <span className="text-[var(--color-text-muted)]">Name:</span>{" "}
                                  {review.customerName}
                                </p>
                                <p>
                                  <span className="text-[var(--color-text-muted)]">Email:</span>{" "}
                                  {review.customerEmail}
                                </p>
                                <p>
                                  <span className="text-[var(--color-text-muted)]">Date:</span>{" "}
                                  {formatDate(review.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-[var(--color-text)]">
                              Moderate Review
                            </h4>

                            <div className="text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2">
                              <p className="text-[var(--color-text-muted)] text-xs mb-1">Current Status</p>
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[review.status]}`}
                              >
                                {STATUS_LABELS[review.status]}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2">
                              {review.status !== "approved" && (
                                <button
                                  onClick={() =>
                                    updateReviewStatus(review.id, "approved")
                                  }
                                  disabled={updatingId === review.id}
                                  className="w-full px-4 py-2.5 rounded-lg text-white font-semibold text-sm bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {updatingId === review.id
                                    ? "Updating..."
                                    : "Approve Review"}
                                </button>
                              )}
                              {review.status !== "rejected" && (
                                <button
                                  onClick={() =>
                                    updateReviewStatus(review.id, "rejected")
                                  }
                                  disabled={updatingId === review.id}
                                  className="w-full px-4 py-2.5 rounded-lg text-white font-semibold text-sm bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {updatingId === review.id
                                    ? "Updating..."
                                    : "Reject Review"}
                                </button>
                              )}
                              {review.status !== "pending" && (
                                <button
                                  onClick={() =>
                                    updateReviewStatus(review.id, "pending")
                                  }
                                  disabled={updatingId === review.id}
                                  className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {updatingId === review.id
                                    ? "Updating..."
                                    : "Reset to Pending"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    {filterStatus === "all"
                      ? "No reviews yet"
                      : `No ${STATUS_LABELS[filterStatus].toLowerCase()} reviews`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
