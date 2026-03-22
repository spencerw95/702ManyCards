"use client";

import { useState, useRef, useCallback } from "react";

interface MultiImageUploadProps {
  currentUrls?: string[];
  folder?: string;
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function MultiImageUpload({
  currentUrls = [],
  folder = "accessories",
  onChange,
  maxImages = 6,
}: MultiImageUploadProps) {
  const [urls, setUrls] = useState<string[]>(currentUrls);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const updateUrls = useCallback(
    (newUrls: string[]) => {
      setUrls(newUrls);
      onChange(newUrls);
    },
    [onChange]
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError("");

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const remaining = maxImages - urls.length;

      if (remaining <= 0) {
        setError(`Maximum ${maxImages} images allowed.`);
        return;
      }

      const toUpload = Array.from(files).slice(0, remaining);

      for (const file of toUpload) {
        if (!allowedTypes.includes(file.type)) {
          setError("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError("File too large. Maximum 5MB each.");
          continue;
        }
      }

      const validFiles = toUpload.filter(
        (f) => allowedTypes.includes(f.type) && f.size <= 5 * 1024 * 1024
      );

      if (validFiles.length === 0) return;

      setUploading(true);

      const newUrls = [...urls];

      for (const file of validFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (data.success && data.url) {
            newUrls.push(data.url);
          } else {
            setError(data.error || "Upload failed for one file.");
          }
        } catch {
          setError("Upload failed. Please try again.");
        }
      }

      updateUrls(newUrls);
      setUploading(false);
    },
    [urls, folder, maxImages, updateUrls]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newUrls = urls.filter((_, i) => i !== index);
      updateUrls(newUrls);
    },
    [urls, updateUrls]
  );

  const moveImage = useCallback(
    (index: number, direction: "up" | "down") => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= urls.length) return;
      const newUrls = [...urls];
      [newUrls[index], newUrls[target]] = [newUrls[target], newUrls[index]];
      updateUrls(newUrls);
    },
    [urls, updateUrls]
  );

  const canAdd = urls.length < maxImages;

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
        Product Images ({urls.length}/{maxImages})
      </label>

      {/* Image grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {urls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-secondary)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full aspect-square object-contain p-2"
              />

              {/* Primary badge */}
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-[var(--color-primary)] text-white flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Primary
                </span>
              )}

              {/* Controls overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center gap-1 p-1.5 opacity-0 group-hover:opacity-100">
                {/* Move up (left in grid) */}
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, "up")}
                    className="p-1.5 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Move left"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                )}

                {/* Move down (right in grid) */}
                {idx < urls.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, "down")}
                    className="p-1.5 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Move right"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="p-1.5 rounded bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canAdd && (
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-lg border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 py-8 ${
            dragActive
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-bg-secondary)]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-[var(--color-text-muted)]">Uploading...</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <div className="text-center">
                <span className="text-sm font-medium text-[var(--color-primary)]">
                  Click to upload
                </span>
                <span className="text-sm text-[var(--color-text-muted)]"> or drag & drop</span>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                JPEG, PNG, WebP, or GIF (max 5MB each) &mdash; {maxImages - urls.length} remaining
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-[var(--color-danger)] mt-1.5">{error}</p>
      )}
    </div>
  );
}
