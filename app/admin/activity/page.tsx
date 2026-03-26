"use client";

import { useState, useEffect, useCallback } from "react";
import type { ActivityEntry, ActivityAction } from "@/lib/activity-log";

const ACTION_BADGES: Record<ActivityAction, { label: string; color: string }> = {
  login: { label: "Login", color: "bg-gray-100 text-gray-700" },
  logout: { label: "Logout", color: "bg-gray-100 text-gray-700" },
  card_added: { label: "Card Added", color: "bg-green-100 text-green-800" },
  card_updated: { label: "Card Updated", color: "bg-blue-100 text-blue-800" },
  card_deleted: { label: "Card Deleted", color: "bg-red-100 text-red-800" },
  accessory_added: { label: "Accessory Added", color: "bg-green-100 text-green-800" },
  accessory_updated: { label: "Accessory Updated", color: "bg-blue-100 text-blue-800" },
  accessory_deleted: { label: "Accessory Deleted", color: "bg-red-100 text-red-800" },
  csv_uploaded: { label: "CSV Upload", color: "bg-purple-100 text-purple-800" },
  order_status_updated: { label: "Order Updated", color: "bg-blue-100 text-blue-800" },
  order_created: { label: "Order Created", color: "bg-green-100 text-green-800" },
  submission_received: { label: "Submission", color: "bg-purple-100 text-purple-800" },
};

const ALL_ACTIONS: ActivityAction[] = [
  "login", "logout", "card_added", "card_updated", "card_deleted",
  "accessory_added", "accessory_updated", "accessory_deleted",
  "csv_uploaded", "order_status_updated", "order_created", "submission_received",
];

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activity?limit=500");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch {
      // fail silently
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const uniqueUsers = [...new Set(entries.map((e) => e.username))].sort();

  const filtered = entries.filter((e) => {
    const matchesUser = !userFilter || e.username === userFilter;
    const matchesAction = !actionFilter || e.action === actionFilter;
    return matchesUser && matchesAction;
  });

  if (loading) {
    return <div className="h-96 rounded-[var(--radius-lg)] skeleton" />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
        >
          <option value="">All Users</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_BADGES[a].label}</option>
          ))}
        </select>
        <span className="text-sm text-[var(--color-text-muted)] self-center">
          {filtered.length} of {total} entries
        </span>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">User</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Details</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((entry) => {
                const badge = ACTION_BADGES[entry.action] || { label: entry.action, color: "bg-gray-100 text-gray-700" };
                return (
                  <tr key={entry.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{entry.username}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] max-w-[300px] truncate">
                      {entry.details}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">
                      {formatTime(entry.timestamp)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    No activity entries found
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
