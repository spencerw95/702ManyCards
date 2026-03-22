import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - admin access required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const rating = searchParams.get("rating");
    const productType = searchParams.get("product_type");
    const productSlug = searchParams.get("product_slug");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const supabase = getServiceSupabase();

    let query = supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (rating) {
      query = query.eq("rating", parseInt(rating, 10));
    }
    if (productType) {
      query = query.eq("product_type", productType);
    }
    if (productSlug) {
      query = query.eq("product_slug", productSlug);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reviews: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
