import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { getAllOrders } from "@/lib/orders";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get("product_slug");
  const productType = searchParams.get("product_type");

  if (!productSlug || !productType) {
    return NextResponse.json(
      { success: false, error: "product_slug and product_type are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_slug", productSlug)
      .eq("product_type", productType)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Calculate average rating
    const reviews = data || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      success: true,
      reviews,
      count: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      product_type,
      product_slug,
      product_name,
      rating,
      title,
      body: reviewBody,
      customer_name,
      customer_email,
    } = body;

    // Validate required fields
    if (!product_type || !product_slug || !product_name || !rating || !title || !reviewBody) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: product_type, product_slug, product_name, rating, title, body" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const auth = getCustomerFromRequest(request);
    let customerId: string | null = null;
    let name: string;
    let email: string;
    let verifiedPurchase = false;

    if (auth) {
      customerId = auth.id;
      name = customer_name || auth.email.split("@")[0];
      email = auth.email;

      // Check if logged-in customer has an order containing this product
      const orders = await getAllOrders();
      verifiedPurchase = orders.some(
        (order) =>
          order.customer.email.toLowerCase() === auth.email.toLowerCase() &&
          (order.status === "delivered" || order.status === "shipped" || order.status === "processing") &&
          order.items.some(
            (item) =>
              item.cardName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") === product_slug
          )
      );
    } else {
      // Guest review - require name and email
      if (!customer_name || !customer_email) {
        return NextResponse.json(
          { success: false, error: "Guest reviews require customer_name and customer_email" },
          { status: 400 }
        );
      }
      name = customer_name;
      email = customer_email;
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_type,
        product_slug,
        product_name,
        customer_id: customerId,
        customer_name: name,
        customer_email: email,
        rating,
        title,
        body: reviewBody,
        verified_purchase: verifiedPurchase,
        status: "pending",
        helpful_count: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit review";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
