import { createHmac } from "crypto";

export const COOKIE_NAME = "702mc_admin_session";
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export type AdminRole = "owner" | "editor" | "viewer";

export interface AdminUser {
  username: string;
  password: string;
  role: AdminRole;
  createdAt?: string;
  displayName?: string;
}

function getSecret(): string {
  return process.env.AUTH_SECRET || "fallback-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// Default admin users — used as fallback when Supabase is unavailable
const DEFAULT_ADMIN_USERS: AdminUser[] = [
  { username: "spencer", password: "702cards2026", role: "owner", createdAt: "2026-03-21" },
  { username: "Damien", password: "Admin123", role: "owner", createdAt: "2026-03-22" },
  { username: "admin", password: "702admin2026", role: "editor", createdAt: "2026-03-21" },
];

/**
 * Get Supabase client for auth operations.
 */
async function getSupabase() {
  try {
    const { getServiceSupabase } = await import("@/lib/supabase");
    return getServiceSupabase();
  } catch {
    return null;
  }
}

/**
 * Get all admin users from Supabase with hardcoded fallback.
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return DEFAULT_ADMIN_USERS;

    const { data, error } = await supabase
      .from("team")
      .select("username, password_hash, display_name, role, created_at")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) return DEFAULT_ADMIN_USERS;

    return data.map((row: Record<string, string>) => ({
      username: row.username,
      password: row.password_hash,
      role: row.role as AdminRole,
      createdAt: row.created_at?.split("T")[0] || "",
      displayName: row.display_name || row.username,
    }));
  } catch {
    return DEFAULT_ADMIN_USERS;
  }
}

/**
 * Add a team member to Supabase.
 */
export async function addTeamMember(username: string, password: string, role: AdminRole, displayName?: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from("team").insert({
      id: crypto.randomUUID(),
      username,
      password_hash: password,
      display_name: displayName || username,
      role,
      created_at: new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Remove a team member from Supabase.
 */
export async function removeTeamMember(username: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.from("team").delete().eq("username", username);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Update a team member in Supabase.
 */
export async function updateTeamMember(username: string, updates: { password?: string; role?: AdminRole; displayName?: string }): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return false;

    const updateData: Record<string, string> = {};
    if (updates.password) updateData.password_hash = updates.password;
    if (updates.role) updateData.role = updates.role;
    if (updates.displayName) updateData.display_name = updates.displayName;

    const { error } = await supabase.from("team").update(updateData).eq("username", username);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Validate credentials against Supabase team table.
 */
export async function validateCredentials(username: string, password: string): Promise<AdminUser | null> {
  const users = await getAdminUsers();
  // Case-insensitive username match, exact password match
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password) || null;
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
