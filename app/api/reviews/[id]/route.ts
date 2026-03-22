import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - admin access required" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - admin access required" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete review";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
