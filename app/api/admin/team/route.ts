import { NextResponse } from "next/server";
import { getAdminUsers, writeAdminUsers, getUserFromCookies } from "@/lib/auth";
import type { AdminRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

/**
 * GET: Return all team members (passwords hidden).
 */
export async function GET(request: Request) {
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.role !== "owner") {
    return NextResponse.json(
      { success: false, error: "Only owners can manage team members" },
      { status: 403 }
    );
  }

  const users = getAdminUsers().map((u) => ({
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
  }));

  return NextResponse.json(users);
}

/**
 * POST: Add a new team member.
 */
export async function POST(request: Request) {
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.role !== "owner") {
    return NextResponse.json(
      { success: false, error: "Only owners can add team members" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Username, password, and role are required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const validRoles: AdminRole[] = ["owner", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role must be owner, editor, or viewer" },
        { status: 400 }
      );
    }

    const users = getAdminUsers();

    if (users.find((u) => u.username === username)) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    users.push({
      username,
      password,
      role,
      createdAt: new Date().toISOString().split("T")[0],
    });

    writeAdminUsers(users);

    logActivity("login", currentUser.username, `Added team member "${username}" (${role})`);

    return NextResponse.json(
      { success: true, user: { username, role } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * PUT: Update a team member (role or password).
 */
export async function PUT(request: Request) {
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.role !== "owner") {
    return NextResponse.json(
      { success: false, error: "Only owners can update team members" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    const users = getAdminUsers();
    const index = users.findIndex((u) => u.username === username);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      users[index].password = password;
    }

    if (role) {
      const validRoles: AdminRole[] = ["owner", "editor", "viewer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: "Role must be owner, editor, or viewer" },
          { status: 400 }
        );
      }
      users[index].role = role;
    }

    writeAdminUsers(users);

    const changes = [];
    if (password) changes.push("password");
    if (role) changes.push(`role to ${role}`);

    logActivity("login", currentUser.username, `Updated team member "${username}" (${changes.join(", ")})`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * DELETE: Remove a team member.
 */
export async function DELETE(request: Request) {
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.role !== "owner") {
    return NextResponse.json(
      { success: false, error: "Only owners can remove team members" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { success: false, error: "Username query parameter is required" },
      { status: 400 }
    );
  }

  // Can't delete yourself
  if (username === currentUser.username) {
    return NextResponse.json(
      { success: false, error: "You cannot remove yourself" },
      { status: 400 }
    );
  }

  const users = getAdminUsers();
  const index = users.findIndex((u) => u.username === username);

  if (index === -1) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  const removed = users[index];
  users.splice(index, 1);
  writeAdminUsers(users);

  logActivity("login", currentUser.username, `Removed team member "${removed.username}" (was ${removed.role})`);

  return NextResponse.json({ success: true });
}
