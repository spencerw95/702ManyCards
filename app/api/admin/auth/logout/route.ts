import { NextResponse } from "next/server";
import { COOKIE_NAME, getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (user) {
    logActivity("logout", user.username, `${user.username} logged out`);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
