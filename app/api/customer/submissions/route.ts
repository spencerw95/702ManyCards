import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { getAllSubmissions } from "@/lib/submissions";

export async function GET(request: Request) {
  const auth = getCustomerFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const allSubmissions = getAllSubmissions();
  const customerSubmissions = allSubmissions.filter(
    (sub) => sub.customer.email.toLowerCase() === auth.email.toLowerCase()
  );

  // Sort newest first
  customerSubmissions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ success: true, submissions: customerSubmissions });
}
