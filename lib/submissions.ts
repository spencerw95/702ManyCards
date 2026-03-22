import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { CardSubmission, SubmissionStatus } from "./types";

const SUBMISSIONS_FILE = path.join(process.cwd(), "data", "submissions.json");

function readSubmissions(): CardSubmission[] {
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
    return JSON.parse(raw) as CardSubmission[];
  } catch {
    return [];
  }
}

function writeSubmissions(submissions: CardSubmission[]): void {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
}

/**
 * Get all submissions.
 */
export function getAllSubmissions(): CardSubmission[] {
  return readSubmissions();
}

/**
 * Get a single submission by ID.
 */
export function getSubmissionById(id: string): CardSubmission | undefined {
  return readSubmissions().find((s) => s.id === id);
}

/**
 * Create a new submission. Generates ID and timestamps automatically.
 */
export function createSubmission(
  data: Omit<CardSubmission, "id" | "status" | "createdAt" | "updatedAt" | "offerAmount" | "adminNotes" | "responseMessage">
): CardSubmission {
  const submissions = readSubmissions();
  const id = `SUB-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const newSubmission: CardSubmission = {
    ...data,
    id,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  submissions.push(newSubmission);
  writeSubmissions(submissions);
  return newSubmission;
}

/**
 * Update an existing submission.
 */
export function updateSubmission(
  id: string,
  updates: Partial<Pick<CardSubmission, "status" | "offerAmount" | "adminNotes" | "responseMessage">>
): CardSubmission {
  const submissions = readSubmissions();
  const index = submissions.findIndex((s) => s.id === id);

  if (index === -1) {
    throw new Error(`Submission not found: ${id}`);
  }

  if (updates.status !== undefined) submissions[index].status = updates.status;
  if (updates.offerAmount !== undefined) submissions[index].offerAmount = updates.offerAmount;
  if (updates.adminNotes !== undefined) submissions[index].adminNotes = updates.adminNotes;
  if (updates.responseMessage !== undefined) submissions[index].responseMessage = updates.responseMessage;
  submissions[index].updatedAt = new Date().toISOString();

  writeSubmissions(submissions);
  return submissions[index];
}

/**
 * Get submission counts by status.
 */
export function getSubmissionStats(): Record<SubmissionStatus, number> {
  const submissions = readSubmissions();
  const stats: Record<SubmissionStatus, number> = {
    pending: 0,
    reviewing: 0,
    offer_sent: 0,
    accepted: 0,
    declined: 0,
    completed: 0,
  };

  for (const s of submissions) {
    if (stats[s.status] !== undefined) {
      stats[s.status]++;
    }
  }

  return stats;
}
