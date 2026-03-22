import { createHmac } from "crypto";
import fs from "fs";
import path from "path";

export const COOKIE_NAME = "702mc_admin_session";
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const TEAM_FILE = path.join(process.cwd(), "data", "team.json");

export type AdminRole = "owner" | "editor" | "viewer";

export interface AdminUser {
  username: string;
  password: string;
  role: AdminRole;
  createdAt?: string;
}

function getSecret(): string {
  return process.env.AUTH_SECRET || "fallback-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// Default admin users — used as fallback when data/team.json is not accessible (e.g., Vercel serverless)
const DEFAULT_ADMIN_USERS: AdminUser[] = [
  { username: "spencer", password: "702cards2026", role: "owner", createdAt: "2026-03-21" },
  { username: "admin", password: "702admin2026", role: "editor", createdAt: "2026-03-21" },
];

/**
 * Get all admin users from data/team.json with hardcoded fallback.
 */
export function getAdminUsers(): AdminUser[] {
  try {
    const raw = fs.readFileSync(TEAM_FILE, "utf-8");
    const users = JSON.parse(raw) as AdminUser[];
    return users.length > 0 ? users : DEFAULT_ADMIN_USERS;
  } catch {
    return DEFAULT_ADMIN_USERS;
  }
}

/**
 * Write admin users to data/team.json.
 */
export function writeAdminUsers(users: AdminUser[]): void {
  fs.writeFileSync(TEAM_FILE, JSON.stringify(users, null, 2), "utf-8");
}

/**
 * Validate credentials against the team member list.
 */
export function validateCredentials(username: string, password: string): AdminUser | null {
  const users = getAdminUsers();
  return users.find((u) => u.username === username && u.password === password) || null;
}

/**
 * Creates a base64-encoded token with username + role + timestamp + HMAC signature.
 */
export function createToken(username: string, role: AdminRole): string {
  const timestamp = Date.now().toString();
  const payload = `${username}:${role}:${timestamp}`;
  const signature = sign(payload);
  const token = `${payload}:${signature}`;
  return Buffer.from(token).toString("base64");
}

/**
 * Verifies the token signature and checks it's not expired (24hr max).
 * Returns { valid, username, role } or { valid: false }.
 */
export function verifyToken(token: string): {
  valid: boolean;
  username?: string;
  role?: AdminRole;
} {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return { valid: false };

    const [username, role, timestamp, signature] = parts;
    if (!username || !role || !timestamp || !signature) return { valid: false };

    // Verify signature
    const payload = `${username}:${role}:${timestamp}`;
    const expectedSignature = sign(payload);
    if (signature !== expectedSignature) return { valid: false };

    // Check expiration
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) return { valid: false };
    if (Date.now() - tokenTime > TOKEN_MAX_AGE_MS) return { valid: false };

    return { valid: true, username, role: role as AdminRole };
  } catch {
    return { valid: false };
  }
}

/**
 * Extract the current user from a request's cookies.
 * Works in both API routes and server components.
 */
export function getUserFromRequest(request: Request): {
  username: string;
  role: AdminRole;
} | null {
  // Try the Cookie header first (works in most contexts)
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match) {
    const result = verifyToken(match[1]);
    if (result.valid && result.username && result.role) {
      return { username: result.username, role: result.role };
    }
  }
  return null;
}

/**
 * Async version that uses next/headers cookies() — more reliable in API routes.
 */
export async function getUserFromCookies(): Promise<{
  username: string;
  role: AdminRole;
} | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const result = verifyToken(token);
    if (!result.valid || !result.username || !result.role) return null;
    return { username: result.username, role: result.role };
  } catch {
    return null;
  }
}
