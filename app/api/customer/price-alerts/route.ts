import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("customer_id", auth.id)
    .eq("notified", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch price alerts" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, alerts: data });
}

export async function POST(request: Request) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { card_name, slug, target_price, image_url, current_price } = body;

    if (!card_name || !slug || target_price == null) {
      return NextResponse.json(
        { success: false, error: "card_name, slug, and target_price are required" },
        { status: 400 }
      );
    }

    if (typeof target_price !== "number" || target_price <= 0) {
      return NextResponse.json(
        { success: false, error: "target_price must be a positive number" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if alert already exists for this customer + slug
    const { data: existing } = await supabase
      .from("price_alerts")
      .select("id")
      .eq("customer_id", auth.id)
      .eq("slug", slug)
      .eq("notified", false)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing alert
      const { data, error } = await supabase
        .from("price_alerts")
        .update({
          target_price,
          current_price: current_price || null,
          image_url: image_url || null,
        })
        .eq("id", existing[0].id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to update price alert" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, alert: data });
    }

    // Create new alert
    const { data, error } = await supabase
      .from("price_alerts")
      .insert({
        customer_id: auth.id,
        customer_email: auth.email,
        card_name,
        slug,
        target_price,
        current_price: current_price || null,
        image_url: image_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to create price alert" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, alert: data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const alertId = url.searchParams.get("id");

  if (!alertId) {
    return NextResponse.json(
      { success: false, error: "Alert id is required" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Ensure the alert belongs to this customer
  const { error } = await supabase
    .from("price_alerts")
    .delete()
    .eq("id", alertId)
    .eq("customer_id", auth.id);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete price alert" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
