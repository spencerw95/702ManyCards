import { NextResponse } from "next/server";
import { getAllSubmissions, updateSubmission } from "@/lib/submissions";
import type { SubmissionStatus } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const VALID_STATUSES: SubmissionStatus[] = [
  "pending",
  "reviewing",
  "offer_sent",
  "accepted",
  "declined",
  "completed",
];

export async function GET() {
  const submissions = await getAllSubmissions();
  return NextResponse.json(submissions);
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { id, status, offerAmount, adminNotes, responseMessage } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Submission id is required" },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (offerAmount !== undefined) updates.offerAmount = Number(offerAmount);
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (responseMessage !== undefined) updates.responseMessage = responseMessage;

    const submission = await updateSubmission(id, updates as Parameters<typeof updateSubmission>[1]);

    if (status) {
      await logActivity(
        "submission_received",
        user?.username || "unknown",
        `Updated submission ${id} status to "${status}"`,
        { submissionId: id, newStatus: status }
      );
    }

    return NextResponse.json({ success: true, submission });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
