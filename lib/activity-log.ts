import { getServiceSupabase } from "./supabase";

export type ActivityAction =
  | "login"
  | "logout"
  | "card_added"
  | "card_updated"
  | "card_deleted"
  | "accessory_added"
  | "accessory_updated"
  | "accessory_deleted"
  | "csv_uploaded"
  | "order_status_updated"
  | "order_created"
  | "submission_received";

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  username: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Log an admin activity to Supabase.
 */
export async function logActivity(
  action: ActivityAction,
  username: string,
  details: string,
  metadata?: Record<string, unknown>
): Promise<ActivityEntry | null> {
  try {
    const sb = getServiceSupabase();
    const entry = {
      action,
      username,
      details,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await sb
      .from("activity_log")
      .insert(entry)
      .select()
      .single();

    if (error) {
      console.error("[activity-log] Failed to log activity:", error.message);
      return null;
    }

    return {
      id: data.id,
      action: data.action,
      username: data.username,
      details: data.details,
      metadata: data.metadata,
      timestamp: data.timestamp,
    };
  } catch (e) {
    console.error("[activity-log] Error logging activity:", e);
    return null;
  }
}

/**
 * Get recent activity log entries from Supabase.
 */
export async function getActivityLog(limit = 50, offset = 0): Promise<{
  entries: ActivityEntry[];
  total: number;
}> {
  try {
    const sb = getServiceSupabase();

    // Get total count
    const { count } = await sb
      .from("activity_log")
      .select("*", { count: "exact", head: true });

    // Get paginated entries (newest first)
    const { data, error } = await sb
      .from("activity_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const entries: ActivityEntry[] = (data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      action: row.action as ActivityAction,
      username: row.username as string,
      details: row.details as string,
      metadata: (row.metadata as Record<string, unknown>) || undefined,
      timestamp: row.timestamp as string,
    }));

    return { entries, total: count || 0 };
  } catch (e) {
    console.error("[activity-log] Failed to fetch activity log:", e);
    return { entries: [], total: 0 };
  }
}

/**
 * Get activity log for a specific user.
 */
export async function getActivityByUser(username: string, limit = 50): Promise<ActivityEntry[]> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("activity_log")
      .select("*")
      .eq("username", username)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      action: row.action as ActivityAction,
      username: row.username as string,
      details: row.details as string,
      metadata: (row.metadata as Record<string, unknown>) || undefined,
      timestamp: row.timestamp as string,
    }));
  } catch (e) {
    console.error("[activity-log] Failed to fetch user activity:", e);
    return [];
  }
}
