import { randomBytes } from "crypto";
import type { CardSubmission, SubmissionStatus } from "./types";
import { getServiceSupabase } from "./supabase";

function mapRow(row: Record<string, unknown>): CardSubmission {
  return {
    id: row.id as string,
    customer: row.customer as CardSubmission["customer"],
    description: (row.description as string) || "",
    estimatedValue: (row.estimated_value as string) || undefined,
    cardCount: row.card_count != null ? Number(row.card_count) : undefined,
    games: (row.games as string[]) || undefined,
    images: (row.images as CardSubmission["images"]) || [],
    status: (row.status as SubmissionStatus) || "pending",
    offerAmount: row.offer_amount != null ? Number(row.offer_amount) : undefined,
    adminNotes: (row.admin_notes as string) || undefined,
    responseMessage: (row.response_message as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAllSubmissions(): Promise<CardSubmission[]> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  } catch (e) {
    console.error("[submissions] getAllSubmissions failed:", e);
    return [];
  }
}

export async function getSubmissionById(id: string): Promise<CardSubmission | undefined> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data ? mapRow(data) : undefined;
  } catch (e) {
    console.error("[submissions] getSubmissionById failed:", e);
    return undefined;
  }
}

export async function createSubmission(
  data: Omit<CardSubmission, "id" | "status" | "createdAt" | "updatedAt" | "offerAmount" | "adminNotes" | "responseMessage">
): Promise<CardSubmission> {
  const sb = getServiceSupabase();
  const id = `SUB-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const row = {
    id,
    customer: data.customer,
    description: data.description,
    estimated_value: data.estimatedValue || null,
    card_count: data.cardCount || null,
    games: data.games || null,
    images: data.images || [],
    status: "pending",
    created_at: now,
    updated_at: now,
  };

  const { data: inserted, error } = await sb.from("submissions").insert(row).select().single();
  if (error) throw error;
  return mapRow(inserted);
}

export async function updateSubmission(
  id: string,
  updates: Partial<Pick<CardSubmission, "status" | "offerAmount" | "adminNotes" | "responseMessage">>
): Promise<CardSubmission> {
  const sb = getServiceSupabase();
  const now = new Date().toISOString();

  const dbUpdates: Record<string, unknown> = { updated_at: now };
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.offerAmount !== undefined) dbUpdates.offer_amount = updates.offerAmount;
  if (updates.adminNotes !== undefined) dbUpdates.admin_notes = updates.adminNotes;
  if (updates.responseMessage !== undefined) dbUpdates.response_message = updates.responseMessage;

  const { data, error } = await sb
    .from("submissions")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error(`Submission not found: ${id}`);
  return mapRow(data);
}

export async function getSubmissionStats(): Promise<Record<SubmissionStatus, number>> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb.from("submissions").select("status");
    if (error) throw error;

    const stats: Record<SubmissionStatus, number> = {
      pending: 0,
      reviewing: 0,
      offer_sent: 0,
      accepted: 0,
      declined: 0,
      completed: 0,
    };

    for (const row of data || []) {
      const s = row.status as SubmissionStatus;
      if (stats[s] !== undefined) stats[s]++;
    }

    return stats;
  } catch (e) {
    console.error("[submissions] getSubmissionStats failed:", e);
    return { pending: 0, reviewing: 0, offer_sent: 0, accepted: 0, declined: 0, completed: 0 };
  }
}
