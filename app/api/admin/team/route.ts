import { NextResponse } from "next/server";
import { getAdminUsers, addTeamMember, updateTeamMember, removeTeamMember, getUserFromCookies } from "@/lib/auth";
import type { AdminRole } from "@/lib/auth";

/**
 * GET: Return all team members (passwords hidden).
 */
export async function GET() {
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.role !== "owner") {
    return NextResponse.json(
      { success: false, error: "Only owners can manage team members" },
      { status: 403 }
    );
  }

  const users = (await getAdminUsers()).map((u) => ({
    username: u.username,
    displayName: u.displayName || u.username,
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

    const users = await getAdminUsers();
    if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    const success = await addTeamMember(username, password, role);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to add team member" },
        { status: 500 }
      );
    }

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

    if (password && password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (role) {
      const validRoles: AdminRole[] = ["owner", "editor", "viewer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: "Role must be owner, editor, or viewer" },
          { status: 400 }
        );
      }
    }

    const success = await updateTeamMember(username, { password, role });
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to update team member" },
        { status: 500 }
      );
    }

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

  if (username === currentUser.username) {
    return NextResponse.json(
      { success: false, error: "You cannot remove yourself" },
      { status: 400 }
    );
  }

  const success = await removeTeamMember(username);
  if (!success) {
    return NextResponse.json(
      { success: false, error: "Failed to remove team member" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
