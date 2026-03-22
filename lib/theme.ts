"use client";

const THEME_KEY = "702mc_theme";

export type ThemeMode = "light" | "dark";

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  // Check system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function setTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, mode);
  document.documentElement.setAttribute("data-theme", mode);
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: mode }));
}

export function toggleTheme(): ThemeMode {
  const current = getTheme();
  const next = current === "light" ? "dark" : "light";
  setTheme(next);
  return next;
}

export function initTheme(): ThemeMode {
  const theme = getTheme();
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
  return theme;
}
