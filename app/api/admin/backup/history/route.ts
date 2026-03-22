import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Fetch backup history error:", error);
      return NextResponse.json({ backups: [] });
    }

    return NextResponse.json({ backups: data || [] });
  } catch {
    return NextResponse.json({ backups: [] });
  }
}
