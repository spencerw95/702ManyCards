import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac } from "crypto";

// ── Admin Auth ──
const ADMIN_COOKIE = "702mc_admin_session";
const ADMIN_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function verifyAdminToken(token: string): boolean {
  try {
    const secret = process.env.AUTH_SECRET || "fallback-secret";
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;

    const [username, role, timestamp, signature] = parts;
    if (!username || !role || !timestamp || !signature) return false;

    const payload = `${username}:${role}:${timestamp}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    if (signature !== expectedSignature) return false;

    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) return false;
    if (Date.now() - tokenTime > ADMIN_TOKEN_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

// ── Customer Auth ──
const CUSTOMER_COOKIE = "702mc_customer_session";
const CUSTOMER_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function verifyCustomerToken(token: string): boolean {
  try {
    const secret = process.env.AUTH_SECRET || "fallback-secret";
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;

    const [id, email, timestamp, signature] = parts;
    if (!id || !email || !timestamp || !signature) return false;

    const payload = `${id}:${email}:${timestamp}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    if (signature !== expectedSignature) return false;

    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) return false;
    if (Date.now() - tokenTime > CUSTOMER_TOKEN_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

// ── Customer routes that don't require auth ──
const CUSTOMER_PUBLIC_ROUTES = [
  "/api/customer/register",
  "/api/customer/login",
  "/account/login",
  "/account/register",
];

// ── Customer API routes that require auth ──
const CUSTOMER_PROTECTED_API_PREFIXES = [
  "/api/customer/profile",
  "/api/customer/orders",
  "/api/customer/wishlist",
  "/api/customer/submissions",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ══════════════════════════════════════════════
  //  ADMIN ROUTES
  // ══════════════════════════════════════════════

  // Allow /admin/login page without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Allow /api/admin/auth/* routes without auth
  if (pathname.startsWith("/api/admin/auth/")) {
    return NextResponse.next();
  }

  // Protect /admin routes and /api/admin routes
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    if (!token || !verifyAdminToken(token)) {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ══════════════════════════════════════════════
  //  CUSTOMER ROUTES
  // ══════════════════════════════════════════════

  // Allow public customer routes without auth
  if (CUSTOMER_PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow customer logout without auth check (it just clears the cookie)
  if (pathname === "/api/customer/logout") {
    return NextResponse.next();
  }

  // Protect customer API routes
  const isCustomerApi = CUSTOMER_PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isCustomerApi) {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!token || !verifyCustomerToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  // Protect /account/* pages (except login/register which are handled above)
  const isAccountPage = pathname.startsWith("/account") && !CUSTOMER_PUBLIC_ROUTES.includes(pathname);

  if (isAccountPage) {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!token || !verifyCustomerToken(token)) {
      const loginUrl = new URL("/account/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*", "/api/customer/:path*"],
};
