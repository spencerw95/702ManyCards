import { NextResponse } from "next/server";
import { getActivityLog } from "@/lib/activity-log";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await getActivityLog(limit, offset);
  return NextResponse.json(result);
}
