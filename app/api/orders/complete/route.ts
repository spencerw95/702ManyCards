import { NextRequest, NextResponse } from "next/server";
import { deductInventory } from "@/lib/supabase-inventory";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/orders/complete — completes an order and deducts inventory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items } = body;

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing orderId or items" },
        { status: 400 }
      );
    }

    // Deduct inventory quantities
    const deductionResult = await deductInventory(
      items.map((item: { inventoryId: string; quantity: number }) => ({
        id: item.inventoryId,
        quantity: item.quantity,
      }))
    );

    if (!deductionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Some items could not be deducted",
          details: deductionResult.errors,
        },
        { status: 409 }
      );
    }

    // Update order status to confirmed
    const sb = getServiceSupabase();
    await sb
      .from("orders")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    // Log the activity
    await sb.from("activity_log").insert({
      action: "order_completed",
      details: `Order ${orderId} completed — ${items.length} item(s) deducted from inventory`,
      user_name: "system",
      item_id: orderId,
      item_type: "order",
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Order completion error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
