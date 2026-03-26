import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { logActivity } from "@/lib/activity-log";
import type { OrderItem } from "@/lib/types";

interface CreateOrderBody {
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  notes?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/orders — public endpoint for customers placing orders
export async function POST(request: Request) {
  try {
    const body: CreateOrderBody = await request.json();

    const { items, customer, subtotal, shipping, discount, total } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    if (!customer?.name || !customer?.email) {
      return NextResponse.json(
        { success: false, error: "Customer name and email are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(customer.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer email address" },
        { status: 400 }
      );
    }

    if (
      !customer?.address?.street ||
      !customer?.address?.city ||
      !customer?.address?.state ||
      !customer?.address?.zip ||
      !customer?.address?.country
    ) {
      return NextResponse.json(
        { success: false, error: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    if (typeof subtotal !== "number" || typeof shipping !== "number" || typeof total !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid order totals" },
        { status: 400 }
      );
    }

    // Validate each item has the required fields
    for (const item of items) {
      if (!item.inventoryId || !item.cardName || typeof item.price !== "number" || typeof item.quantity !== "number" || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: "Each item must have inventoryId, cardName, price, and quantity >= 1" },
          { status: 400 }
        );
      }
    }

    const order = await createOrder({
      items,
      customer,
      subtotal,
      shipping,
      discount: discount ?? 0,
      total,
      status: "pending",
      notes: body.notes,
    });

    await logActivity(
      "order_created",
      customer.email,
      `New order ${order.id} from ${customer.name} (${customer.email}) — ${items.length} item(s), total $${total.toFixed(2)}`,
      { orderId: order.id, itemCount: items.length, total }
    );

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
