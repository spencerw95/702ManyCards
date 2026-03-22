import { NextResponse } from "next/server";
import {
  getCustomerFromRequest,
  getCustomerById,
  updateCustomer,
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

  return NextResponse.json({ success: true, wishlist: customer.wishlist });
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
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 }
      );
    }

    const customer = getCustomerById(auth.id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    if (customer.wishlist.includes(slug)) {
      return NextResponse.json({ success: true, wishlist: customer.wishlist });
    }

    const updated = updateCustomer(auth.id, {
      wishlist: [...customer.wishlist, slug],
    });

    return NextResponse.json({ success: true, wishlist: updated.wishlist });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update wishlist" },
      { status: 500 }
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
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Slug query parameter is required" },
      { status: 400 }
    );
  }

  const customer = getCustomerById(auth.id);
  if (!customer) {
    return NextResponse.json(
      { success: false, error: "Customer not found" },
      { status: 404 }
    );
  }

  const updated = updateCustomer(auth.id, {
    wishlist: customer.wishlist.filter((s) => s !== slug),
  });

  return NextResponse.json({ success: true, wishlist: updated.wishlist });
}
