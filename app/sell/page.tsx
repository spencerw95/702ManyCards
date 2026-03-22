"use client";

import { useState, type FormEvent } from "react";

const CAPTION_OPTIONS = ["Front", "Back", "Close-up", "Collection Overview"];
const GAME_OPTIONS = ["Yu-Gi-Oh!", "Pokemon", "Magic: The Gathering", "Other"];

interface ImageField {
  url: string;
  caption: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  description: string;
  estimatedValue: string;
  cardCount: string;
  games: string[];
  images: ImageField[];
}

interface FormErrors {
  name?: string;
  email?: string;
  description?: string;
  images?: string;
}

export default function SellPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    description: "",
    estimatedValue: "",
    cardCount: "",
    games: [],
    images: [{ url: "", caption: "" }],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!form.description.trim()) {
      errs.description = "Please describe what you are selling.";
    }
    const validImages = form.images.filter((img) => img.url.trim().length > 0);
    if (validImages.length === 0) {
      errs.images = "Please provide at least one image URL.";
    }
    return errs;
  }

  function toggleGame(game: string) {
    setForm((prev) => ({
      ...prev,
      games: prev.games.includes(game)
        ? prev.games.filter((g) => g !== game)
        : [...prev.games, game],
    }));
  }

  function addImageField() {
    if (form.images.length < 5) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, { url: "", caption: "" }],
      }));
    }
  }

  function removeImageField(index: number) {
    if (form.images.length > 1) {
      setForm((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  }

  function updateImage(index: number, field: "url" | "caption", value: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, [field]: value } : img
      ),
    }));
  }

  function isValidImageUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    try {
      const validImages = form.images
        .filter((img) => img.url.trim().length > 0)
        .map((img) => ({
          url: img.url.trim(),
          caption: img.caption || undefined,
        }));

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
          },
          description: form.description.trim(),
          estimatedValue: form.estimatedValue.trim() || undefined,
          cardCount: form.cardCount ? Number(form.cardCount) : undefined,
          games: form.games.length > 0 ? form.games : undefined,
          images: validImages,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setSubmissionId(data.id);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  // Success state
  if (status === "success") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-success)]/10 mb-6">
          <svg className="w-10 h-10 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold mb-3">Submission Received!</h1>
        <p className="text-lg text-[var(--color-text-secondary)] mb-4">
          Thank you for your submission. We will review your cards and get back to you within 24 hours.
        </p>
        {submissionId && (
          <p className="text-sm text-[var(--color-text-muted)] mb-8">
            Your submission ID: <span className="font-mono font-semibold text-[var(--color-text)]">{submissionId}</span>
          </p>
        )}
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-lg text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Back to Store
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 mb-4">
          <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Sell Us Your Cards</h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Got cards to sell? Submit photos and we will make you an offer within 24 hours.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {[
          { num: "1", title: "Take Photos", desc: "Take clear photos of your cards (front and back)" },
          { num: "2", title: "Fill Out Form", desc: "Fill out the form below with details" },
          { num: "3", title: "Get an Offer", desc: "We will review and send you an offer" },
          { num: "4", title: "Ship & Get Paid", desc: "Accept the offer and ship your cards" },
        ].map((step) => (
          <div
            key={step.num}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 text-center"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-white font-bold text-lg mb-3">
              {step.num}
            </div>
            <h3 className="font-semibold text-[var(--color-text)] mb-1">{step.title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {status === "error" && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30">
          <p className="text-sm font-medium text-[var(--color-danger)]">
            Something went wrong. Please try again later.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Your Info Section */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl font-bold mb-4">Your Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Name <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                  errors.name ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                }`}
                placeholder="Your name"
              />
              {errors.name && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors ${
                  errors.email ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.email}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                Phone <span className="text-[var(--color-text-muted)]">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* About Your Cards Section */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl font-bold mb-4">About Your Cards</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1.5">
                Description <span className="text-[var(--color-danger)]">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors resize-vertical ${
                  errors.description ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                }`}
                placeholder="Tell us what you're selling, approximate conditions, notable cards, etc."
              />
              {errors.description && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedValue" className="block text-sm font-medium mb-1.5">
                  Estimated Value <span className="text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <input
                  id="estimatedValue"
                  type="text"
                  value={form.estimatedValue}
                  onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                  placeholder="What do you think your cards are worth?"
                />
              </div>
              <div>
                <label htmlFor="cardCount" className="block text-sm font-medium mb-1.5">
                  Number of Cards <span className="text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <input
                  id="cardCount"
                  type="number"
                  min="1"
                  value={form.cardCount}
                  onChange={(e) => setForm({ ...form, cardCount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                  placeholder="Approximate count"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Games <span className="text-[var(--color-text-muted)]">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {GAME_OPTIONS.map((game) => (
                  <label
                    key={game}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      form.games.includes(game)
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.games.includes(game)}
                      onChange={() => toggleGame(game)}
                      className="sr-only"
                    />
                    <svg
                      className={`w-4 h-4 ${form.games.includes(game) ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      {form.games.includes(game) ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <circle cx="12" cy="12" r="9" />
                      )}
                    </svg>
                    <span className="text-sm font-medium">{game}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl font-bold mb-1">Photos</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Upload photos to Imgur, Google Photos, or iCloud and paste the share link here. At least 1 photo is required.
          </p>
          {errors.images && (
            <p className="mb-3 text-xs text-[var(--color-danger)]">{errors.images}</p>
          )}

          <div className="space-y-4">
            {form.images.map((img, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">
                    Image URL {index + 1} {index === 0 && <span className="text-[var(--color-danger)]">*</span>}
                  </label>
                  <input
                    type="url"
                    value={img.url}
                    onChange={(e) => updateImage(index, "url", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                    placeholder="https://i.imgur.com/example.jpg"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium mb-1.5">Caption</label>
                  <select
                    value={img.caption}
                    onChange={(e) => updateImage(index, "caption", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-colors"
                  >
                    <option value="">Select...</option>
                    {CAPTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {form.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="self-end sm:self-center p-2.5 rounded-lg text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                    aria-label="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Thumbnail preview */}
                {img.url && isValidImageUrl(img.url) && (
                  <div className="self-end sm:self-center">
                    <img
                      src={img.url}
                      alt={img.caption || `Preview ${index + 1}`}
                      className="w-12 h-12 object-cover rounded-lg border border-[var(--color-border)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {form.images.length < 5 && (
            <button
              type="button"
              onClick={addImageField}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add another photo ({form.images.length}/5)
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full sm:w-auto px-8 py-3 rounded-lg text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit Your Cards"
          )}
        </button>
      </form>
    </div>
  );
}
