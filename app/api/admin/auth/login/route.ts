import { NextResponse } from "next/server";
import { createToken, validateCredentials, COOKIE_NAME } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await validateCredentials(username, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = createToken(user.username, user.role);

    try {
      logActivity("login", user.username, `${user.username} logged in (${user.role})`);
    } catch {
      // Activity logging may fail on read-only filesystems (e.g., Vercel)
    }

    const response = NextResponse.json({
      success: true,
      user: { username: user.username, role: user.role },
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Login error: ${message}` },
      { status: 400 }
    );
  }
}
