import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "You must be logged in to vote" },
      { status: 401 }
    );
  }

  try {
    const { id: reviewId } = await params;
    const supabase = getServiceSupabase();

    // Check if review exists and is approved
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, helpful_count")
      .eq("id", reviewId)
      .eq("status", "approved")
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    // Check for duplicate vote
    const { data: existingVote } = await supabase
      .from("review_votes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("voter_id", auth.id)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { success: false, error: "You have already marked this review as helpful" },
        { status: 409 }
      );
    }

    // Insert the vote
    const { error: voteError } = await supabase
      .from("review_votes")
      .insert({
        review_id: reviewId,
        voter_id: auth.id,
      });

    if (voteError) {
      return NextResponse.json(
        { success: false, error: voteError.message },
        { status: 500 }
      );
    }

    // Increment helpful_count on the review
    const newCount = (review.helpful_count || 0) + 1;
    const { error: updateError } = await supabase
      .from("reviews")
      .update({ helpful_count: newCount, updated_at: new Date().toISOString() })
      .eq("id", reviewId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, helpful_count: newCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record vote";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
