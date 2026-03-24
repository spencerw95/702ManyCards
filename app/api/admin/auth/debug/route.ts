import { NextResponse } from "next/server";
import { getAdminUsers } from "@/lib/auth";

export async function GET() {
  const users = await getAdminUsers();
  // Only show usernames and roles, never passwords
  const safeUsers = users.map((u) => ({
    username: u.username,
    role: u.role,
    hasPassword: !!u.password,
    passwordLength: u.password?.length || 0,
  }));

  return NextResponse.json({
    userCount: users.length,
    users: safeUsers,
    source: users.length > 0 ? "loaded" : "empty",
  });
}
