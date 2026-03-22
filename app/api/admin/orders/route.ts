import { NextResponse } from "next/server";
import { getAllOrders, createOrder, updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/**
 * GET: Return all orders.
 */
export async function GET() {
  const orders = getAllOrders();
  return NextResponse.json(orders);
}

/**
 * POST: Create a new order.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    if (!body.customer || !body.customer.name || !body.customer.email) {
      return NextResponse.json(
        { success: false, error: "Customer name and email are required" },
        { status: 400 }
      );
    }

    const order = createOrder({
      items: body.items,
      customer: body.customer,
      subtotal: body.subtotal ?? 0,
      shipping: body.shipping ?? 0,
      discount: body.discount ?? 0,
      total: body.total ?? 0,
      status: body.status ?? "pending",
      notes: body.notes,
    });

    logActivity("order_created", "customer", `New order from ${body.customer.name} ($${order.total.toFixed(2)})`, {
      orderId: order.id,
      customerEmail: body.customer.email,
      total: order.total,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

/**
 * PUT: Update order status.
 */
export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order id is required" },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const order = updateOrderStatus(id, status);

    logActivity("order_status_updated", user?.username || "unknown", `Updated order ${id} status to "${status}"`, {
      orderId: id,
      newStatus: status,
    });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
