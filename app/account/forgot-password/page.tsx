"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        // In dev mode, the API returns the reset URL
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo className="h-12 w-auto" variant="badge" />
          </Link>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6">
          <h1 className="text-xl font-bold text-[var(--color-text)] text-center mb-1">
            Reset Password
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
            Enter your email to receive a reset link
          </p>

          {submitted ? (
            <div className="space-y-4">
              <div className="p-3 rounded-[var(--radius)] bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                If an account exists with that email, a password reset link has been generated.
              </div>

              {resetUrl && (
                <div className="p-3 rounded-[var(--radius)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-sm">
                  <p className="text-[var(--color-text-secondary)] mb-2 font-medium">
                    Dev Mode: Use this link to reset your password:
                  </p>
                  <Link
                    href={resetUrl}
                    className="text-[var(--color-primary)] hover:underline break-all text-xs"
                  >
                    {resetUrl}
                  </Link>
                </div>
              )}

              <button
                onClick={() => {
                  setSubmitted(false);
                  setResetUrl(null);
                  setEmail("");
                }}
                className="w-full py-2.5 px-4 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-semibold hover:bg-[var(--color-bg)] transition-colors cursor-pointer"
              >
                Try another email
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-[var(--radius)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
          Remember your password?{" "}
          <Link
            href="/account/login"
            className="text-[var(--color-primary)] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
