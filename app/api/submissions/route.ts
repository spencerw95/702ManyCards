import { NextResponse } from "next/server";
import { createSubmission } from "@/lib/submissions";
import { logActivity } from "@/lib/activity-log";

/**
 * POST: Create a new card submission (public — no auth required).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customer?.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.customer?.email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customer.email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }

    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one image URL is required" },
        { status: 400 }
      );
    }

    // Filter out empty image URLs
    const validImages = body.images.filter(
      (img: { url?: string }) => img.url && img.url.trim().length > 0
    );

    if (validImages.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid image URL is required" },
        { status: 400 }
      );
    }

    const submission = createSubmission({
      customer: {
        name: body.customer.name.trim(),
        email: body.customer.email.trim(),
        phone: body.customer.phone?.trim() || undefined,
      },
      description: body.description.trim(),
      estimatedValue: body.estimatedValue?.trim() || undefined,
      cardCount: body.cardCount ? Number(body.cardCount) : undefined,
      games: body.games || undefined,
      images: validImages,
    });

    logActivity(
      "submission_received",
      "customer",
      `New card submission from ${body.customer.name} (${validImages.length} photos)`,
      {
        submissionId: submission.id,
        customerEmail: body.customer.email,
        cardCount: body.cardCount,
      }
    );

    return NextResponse.json(
      { success: true, id: submission.id },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
