"use client";

import { useState, useEffect, useCallback } from "react";
import type { CardSubmission, SubmissionStatus } from "@/lib/types";

const STATUS_OPTIONS: SubmissionStatus[] = [
  "pending",
  "reviewing",
  "offer_sent",
  "accepted",
  "declined",
  "completed",
];

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  offer_sent: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  offer_sent: "Offer Sent",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<CardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    status: "" as SubmissionStatus,
    offerAmount: "",
    adminNotes: "",
    responseMessage: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/submissions");
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      // fail silently
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  function startEditing(sub: CardSubmission) {
    setEditingId(sub.id);
    setEditForm({
      status: sub.status,
      offerAmount: sub.offerAmount?.toString() || "",
      adminNotes: sub.adminNotes || "",
      responseMessage: sub.responseMessage || "",
    });
  }

  async function saveSubmission(id: string) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { id };
      if (editForm.status) body.status = editForm.status;
      if (editForm.offerAmount) body.offerAmount = Number(editForm.offerAmount);
      body.adminNotes = editForm.adminNotes;
      body.responseMessage = editForm.responseMessage;

      const res = await fetch("/api/admin/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? data.submission : s))
        );
        setEditingId(null);
      }
    } catch {
      // fail silently
    }
    setSaving(false);
  }

  const filtered =
    filterStatus === "all"
      ? submissions
      : submissions.filter((s) => s.status === filterStatus);

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
        <p className="text-sm text-[var(--color-text-muted)]">
          {filtered.length} submission{filtered.length !== 1 ? "s" : ""}{" "}
          {filterStatus !== "all" && `(${STATUS_LABELS[filterStatus]})`}
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SubmissionStatus | "all")}
            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)] hidden sm:table-cell">Images</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((sub) => (
                <>
                  <tr
                    key={sub.id}
                    className="hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                    onClick={() => {
                      setExpandedId(expandedId === sub.id ? null : sub.id);
                      if (expandedId !== sub.id) startEditing(sub);
                    }}
                  >
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDate(sub.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                      {sub.customer.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell max-w-xs truncate">
                      {sub.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[sub.status]}`}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden sm:table-cell">
                      {sub.images.length}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === sub.id ? null : sub.id);
                          if (expandedId !== sub.id) startEditing(sub);
                        }}
                        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {expandedId === sub.id ? "Close" : "View"}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedId === sub.id && (
                    <tr key={`${sub.id}-detail`}>
                      <td colSpan={6} className="px-4 py-4 bg-[var(--color-bg-secondary)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Info & Images */}
                          <div className="space-y-4">
                            {/* Customer Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Customer Info</h4>
                              <div className="text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2 space-y-1">
                                <p><span className="text-[var(--color-text-muted)]">Name:</span> {sub.customer.name}</p>
                                <p><span className="text-[var(--color-text-muted)]">Email:</span> {sub.customer.email}</p>
                                {sub.customer.phone && (
                                  <p><span className="text-[var(--color-text-muted)]">Phone:</span> {sub.customer.phone}</p>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Description</h4>
                              <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2 whitespace-pre-wrap">
                                {sub.description}
                              </p>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-3">
                              {sub.estimatedValue && (
                                <div className="text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2">
                                  <p className="text-[var(--color-text-muted)] text-xs mb-0.5">Estimated Value</p>
                                  <p className="font-medium">{sub.estimatedValue}</p>
                                </div>
                              )}
                              {sub.cardCount && (
                                <div className="text-sm bg-[var(--color-bg-card)] rounded-[var(--radius)] px-3 py-2">
                                  <p className="text-[var(--color-text-muted)] text-xs mb-0.5">Card Count</p>
                                  <p className="font-medium">{sub.cardCount}</p>
                                </div>
                              )}
                            </div>

                            {/* Games */}
                            {sub.games && sub.games.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Games</h4>
                                <div className="flex flex-wrap gap-2">
                                  {sub.games.map((game) => (
                                    <span
                                      key={game}
                                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                    >
                                      {game}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Images */}
                            <div>
                              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                                Photos ({sub.images.length})
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {sub.images.map((img, i) => (
                                  <a
                                    key={i}
                                    href={img.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group"
                                  >
                                    <div className="aspect-square rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg)]">
                                      <img
                                        src={img.url}
                                        alt={img.caption || `Photo ${i + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "";
                                          (e.target as HTMLImageElement).alt = "Failed to load";
                                        }}
                                      />
                                    </div>
                                    {img.caption && (
                                      <p className="text-xs text-[var(--color-text-muted)] mt-1 text-center">{img.caption}</p>
                                    )}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right: Action Panel */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-[var(--color-text)]">Update Submission</h4>

                            <div>
                              <label className="block text-sm font-medium mb-1.5">Status</label>
                              <select
                                value={editForm.status}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, status: e.target.value as SubmissionStatus })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {STATUS_LABELS[s]}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1.5">Offer Amount ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm.offerAmount}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, offerAmount: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                                placeholder="0.00"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1.5">
                                Internal Notes{" "}
                                <span className="text-[var(--color-text-muted)] font-normal">(admin only)</span>
                              </label>
                              <textarea
                                rows={3}
                                value={editForm.adminNotes}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, adminNotes: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 resize-vertical"
                                placeholder="Private notes about this submission..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1.5">Response Message</label>
                              <textarea
                                rows={3}
                                value={editForm.responseMessage}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, responseMessage: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 resize-vertical"
                                placeholder="Message to send back to the customer..."
                              />
                            </div>

                            <button
                              onClick={() => saveSubmission(sub.id)}
                              disabled={saving}
                              className="w-full px-4 py-2.5 rounded-lg text-white font-semibold text-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? "Saving..." : "Update Submission"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    {filterStatus === "all"
                      ? "No submissions yet"
                      : `No ${STATUS_LABELS[filterStatus].toLowerCase()} submissions`}
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
