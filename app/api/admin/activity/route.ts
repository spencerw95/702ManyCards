import { NextResponse } from "next/server";
import { getActivityLog } from "@/lib/activity-log";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = getActivityLog(limit, offset);
  return NextResponse.json(result);
}
