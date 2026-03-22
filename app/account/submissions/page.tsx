"use client";

import { useState, useEffect } from "react";

interface Submission {
  id: string;
  description: string;
  status: string;
  offerAmount?: number;
  responseMessage?: string;
  images: { url: string; caption?: string }[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  offer_sent: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  reviewing: "Under Review",
  offer_sent: "Offer Sent",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

export default function AccountSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/submissions")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSubmissions(data.submissions);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[var(--radius-lg)] skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">My Submissions</h1>

      {submissions.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
          </svg>
          <p className="text-[var(--color-text-muted)]">No submissions yet.</p>
          <a href="/sell" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
            Sell your cards
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--color-text)]">{sub.id}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[sub.status] || "bg-gray-100 text-gray-800"}`}>
                      {STATUS_LABELS[sub.status] || sub.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{sub.description}</p>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Submitted {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {sub.offerAmount !== undefined && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-[var(--color-text-muted)]">Offer</div>
                    <div className="text-lg font-bold text-[var(--color-success)]">${sub.offerAmount.toFixed(2)}</div>
                  </div>
                )}
              </div>

              {sub.responseMessage && (
                <div className="mt-3 p-3 rounded-[var(--radius)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Response from 702ManyCards:</div>
                  <p className="text-sm text-[var(--color-text)]">{sub.responseMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
