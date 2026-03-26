import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";

const VALID_STATUSES = ["approved", "rejected", "pending"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromCookies();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "status must be one of: approved, rejected, pending" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("reviews")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, review: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update review";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
