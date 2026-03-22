"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";

interface UploadResult {
  success: boolean;
  added?: number;
  updated?: number;
  total?: number;
  error?: string;
}

export default function CSVUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mode, setMode] = useState<"replace" | "merge">("merge");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVPreview = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return;

    // Simple CSV parse for preview (handles basic cases)
    const parseLine = (line: string): string[] => {
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
          if (char === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            current += char;
          }
        } else {
          if (char === '"') inQuotes = true;
          else if (char === ",") {
            fields.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
      }
      fields.push(current.trim());
      return fields;
    };

    const headerRow = parseLine(lines[0]);
    setHeaders(headerRow);

    const rows: string[][] = [];
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      rows.push(parseLine(lines[i]));
    }
    setPreview(rows);
  };

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSVPreview(text);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "text/csv" || f.name.endsWith(".csv"))) {
      handleFile(f);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch("/api/admin/csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
      if (data.success) {
        setFile(null);
        setPreview([]);
        setHeaders([]);
      }
    } catch {
      setResult({ success: false, error: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateContent = [
      "cardName,setCode,setName,rarity,edition,condition,price,quantity,language,game,imageUrl",
      '"Dark Magician","LOB-005","Legend of Blue Eyes White Dragon","Ultra Rare","1st Edition","Near Mint",25.99,1,"English","yugioh",""',
      '"Pikachu VMAX","SWSH045","Sword & Shield Promo","Promo","Unlimited","Near Mint",12.50,3,"English","pokemon",""',
    ].join("\n");

    const blob = new Blob([templateContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Template download */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Upload a CSV file to bulk import inventory
        </p>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
        >
          Download Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-[var(--radius-lg)] p-10 text-center cursor-pointer transition-colors
          ${dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
            : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-secondary)]"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />
        <svg className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {file ? (
          <p className="text-sm text-[var(--color-text)]">
            <span className="font-semibold">{file.name}</span>
            <span className="text-[var(--color-text-muted)]"> ({(file.size / 1024).toFixed(1)} KB)</span>
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text)]">
              <span className="text-[var(--color-primary)] font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">CSV files only</p>
          </>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Preview (first {preview.length} rows)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {preview.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-[var(--color-text)] whitespace-nowrap max-w-[150px] truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode + Upload */}
      {file && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-3">Import Mode</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="merge"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                  className="accent-[var(--color-primary)]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Merge with existing</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Adds new items, updates existing ones by ID</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  className="accent-[var(--color-primary)]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Replace all inventory</p>
                  <p className="text-xs text-[var(--color-danger)]">Warning: This will delete all existing inventory</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-2.5 px-4 rounded-[var(--radius)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`p-4 rounded-[var(--radius-lg)] border ${
            result.success
              ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/20"
              : "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/20"
          }`}
        >
          {result.success ? (
            <div>
              <p className="text-sm font-semibold text-[var(--color-success)]">Upload successful!</p>
              <div className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                <p>Added: {result.added} items</p>
                <p>Updated: {result.updated} items</p>
                <p>Total inventory: {result.total} items</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-danger)]">{result.error || "Upload failed"}</p>
          )}
        </div>
      )}
    </div>
  );
}
