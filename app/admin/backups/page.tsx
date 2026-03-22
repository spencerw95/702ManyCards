"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BackupRecord {
  id: string;
  file_name: string;
  file_size: number;
  record_counts: Record<string, number>;
  created_by: string;
  created_at: string;
}

interface RestoreSummary {
  success: boolean;
  mode: string;
  summary: Record<string, { inserted: number; skipped: number; errors: string[] }>;
  restoredAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [restoreResult, setRestoreResult] = useState<RestoreSummary | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, number> | null>(null);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backup/history");
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch {
      // History may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create backup");
        return;
      }

      const blob = await res.blob();
      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = `702manycards-backup-${dateStr}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Refresh backup history
      fetchBackups();
    } catch {
      alert("Failed to download backup");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setRestoreResult(null);
    setRestoreError("");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.metadata?.recordCounts) {
        setPreviewData(parsed.metadata.recordCounts);
      } else {
        setPreviewData(null);
        setRestoreError("Invalid backup file: missing metadata");
      }
    } catch {
      setPreviewData(null);
      setRestoreError("Invalid file: could not parse as JSON");
    }
  };

  const handleRestore = async () => {
    if (!selectedFile || !previewData) return;

    // For replace mode, require confirmation
    if (restoreMode === "replace" && !showConfirmReplace) {
      setShowConfirmReplace(true);
      return;
    }

    setRestoring(true);
    setRestoreError("");
    setRestoreResult(null);
    setShowConfirmReplace(false);

    try {
      const text = await selectedFile.text();
      const parsed = JSON.parse(text);

      const res = await fetch(`/api/admin/backup/restore?mode=${restoreMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const result = await res.json();
      if (!res.ok) {
        setRestoreError(result.error || "Restore failed");
        return;
      }

      setRestoreResult(result);
      setSelectedFile(null);
      setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setRestoreError("Failed to restore backup");
    } finally {
      setRestoring(false);
    }
  };

  const latestBackup = backups[0];
  const totalRecords = latestBackup
    ? Object.values(latestBackup.record_counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Backups</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Export and restore your store data
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius)] font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Backup...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Backup
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Last Backup</p>
          <p className="text-lg font-bold text-[var(--color-text)] mt-1">
            {latestBackup ? timeAgo(latestBackup.created_at) : "Never"}
          </p>
          {latestBackup && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {formatDate(latestBackup.created_at)}
            </p>
          )}
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Total Records</p>
          <p className="text-lg font-bold text-[var(--color-text)] mt-1">
            {latestBackup ? totalRecords.toLocaleString() : "--"}
          </p>
          {latestBackup && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              across {Object.keys(latestBackup.record_counts).length} tables
            </p>
          )}
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Backup Size</p>
          <p className="text-lg font-bold text-[var(--color-text)] mt-1">
            {latestBackup ? formatBytes(latestBackup.file_size) : "--"}
          </p>
          {latestBackup && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              by {latestBackup.created_by}
            </p>
          )}
        </div>
      </div>

      {/* Record Counts Breakdown (from latest backup) */}
      {latestBackup && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Latest Backup Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(latestBackup.record_counts).map(([table, count]) => (
              <div key={table} className="flex items-center justify-between bg-[var(--color-bg-secondary)] rounded-[var(--radius)] px-3 py-2">
                <span className="text-xs text-[var(--color-text-secondary)] capitalize">
                  {table.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-bold text-[var(--color-text)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restore Section */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Restore from Backup</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Upload a previously downloaded backup file to restore data.
        </p>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-[var(--radius)] p-3 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Caution with Replace Mode</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Replace mode will <strong>delete all existing data</strong> in each table before importing the backup. This is destructive and cannot be undone. Use Merge mode to safely add missing records without affecting existing data.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="restore-mode"
              value="merge"
              checked={restoreMode === "merge"}
              onChange={() => { setRestoreMode("merge"); setShowConfirmReplace(false); }}
              className="accent-[var(--color-primary)]"
            />
            <div>
              <span className="text-sm font-medium text-[var(--color-text)]">Merge</span>
              <p className="text-xs text-[var(--color-text-muted)]">Add missing records, update existing</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="restore-mode"
              value="replace"
              checked={restoreMode === "replace"}
              onChange={() => { setRestoreMode("replace"); setShowConfirmReplace(false); }}
              className="accent-[var(--color-danger)]"
            />
            <div>
              <span className="text-sm font-medium text-[var(--color-danger)]">Replace</span>
              <p className="text-xs text-[var(--color-text-muted)]">Clear tables and re-import everything</p>
            </div>
          </label>
        </div>

        {/* File Upload */}
        <div className="flex items-center gap-3 mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius)] file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:brightness-110 file:cursor-pointer"
          />
        </div>

        {/* File Preview */}
        {previewData && selectedFile && (
          <div className="bg-[var(--color-bg-secondary)] rounded-[var(--radius)] p-3 mb-4">
            <p className="text-xs font-semibold text-[var(--color-text)] mb-2">
              File: {selectedFile.name} ({formatBytes(selectedFile.size)})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(previewData).map(([table, count]) => (
                <div key={table} className="text-xs text-[var(--color-text-secondary)]">
                  <span className="capitalize">{table.replace(/_/g, " ")}</span>:{" "}
                  <span className="font-bold text-[var(--color-text)]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Replace Dialog */}
        {showConfirmReplace && (
          <div className="bg-red-50 border border-red-200 rounded-[var(--radius)] p-3 mb-4">
            <p className="text-sm font-medium text-red-800 mb-2">
              Are you sure? This will delete all existing data and replace it with the backup.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="px-3 py-1.5 bg-[var(--color-danger)] text-white text-sm font-semibold rounded-[var(--radius)] hover:brightness-110 cursor-pointer"
              >
                Yes, Replace All Data
              </button>
              <button
                onClick={() => setShowConfirmReplace(false)}
                className="px-3 py-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--color-bg-secondary)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Restore Button */}
        {!showConfirmReplace && (
          <button
            onClick={handleRestore}
            disabled={!selectedFile || !previewData || restoring}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-[var(--radius)] font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {restoring ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Restore Backup
              </>
            )}
          </button>
        )}

        {/* Restore Error */}
        {restoreError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-[var(--radius)] p-3">
            <p className="text-sm text-red-800">{restoreError}</p>
          </div>
        )}

        {/* Restore Result */}
        {restoreResult && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-[var(--radius)] p-3">
            <p className="text-sm font-medium text-green-800 mb-2">
              Restore completed ({restoreResult.mode} mode)
            </p>
            <div className="space-y-1">
              {Object.entries(restoreResult.summary).map(([table, result]) => (
                <div key={table} className="text-xs text-green-700 flex items-center gap-2">
                  <span className="capitalize font-medium">{table.replace(/_/g, " ")}:</span>
                  <span>{result.inserted} records imported</span>
                  {result.errors.length > 0 && (
                    <span className="text-red-600">({result.errors.length} errors)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backup History */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Backup History</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-sm text-[var(--color-text-muted)]">No backups yet</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Click &quot;Download Backup&quot; to create your first backup
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {backups.map((backup) => {
              const total = Object.values(backup.record_counts).reduce((a, b) => a + b, 0);
              return (
                <div key={backup.id} className="px-4 py-3 flex items-center gap-4 hover:bg-[var(--color-bg-secondary)] transition-colors">
                  <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {backup.file_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {total.toLocaleString()} records &middot; {formatBytes(backup.file_size)} &middot; by {backup.created_by}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[var(--color-text-secondary)]">{timeAgo(backup.created_at)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{formatDate(backup.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
