import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET: Return a single order by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(order);
}
