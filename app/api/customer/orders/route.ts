import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { getAllOrders } from "@/lib/orders";

export async function GET(request: Request) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const allOrders = await getAllOrders();
  const customerOrders = allOrders.filter(
    (order) => order.customer.email.toLowerCase() === auth.email.toLowerCase()
  );

  // Sort by newest first
  customerOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ success: true, orders: customerOrders });
}
