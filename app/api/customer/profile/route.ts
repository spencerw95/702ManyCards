import { NextResponse } from "next/server";
import {
  getCustomerFromRequest,
  getCustomerById,
  updateCustomer,
  changeCustomerPassword,
} from "@/lib/customer-auth";

export async function GET(request: Request) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const customer = getCustomerById(auth.id);
  if (!customer) {
    return NextResponse.json(
      { success: false, error: "Customer not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, customer });
}

export async function PUT(request: Request) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, phone, address, currentPassword, newPassword } = body;

    // Handle password change
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }
      const changed = changeCustomerPassword(auth.id, currentPassword, newPassword);
      if (!changed) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Update profile fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const customer = updateCustomer(auth.id, updates);
    return NextResponse.json({ success: true, customer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
