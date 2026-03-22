import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

const LOG_FILE = path.join(process.cwd(), "data", "activity-log.json");
const MAX_LOG_ENTRIES = 500; // Keep last 500 entries

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

function readLog(): ActivityEntry[] {
  try {
    const raw = fs.readFileSync(LOG_FILE, "utf-8");
    return JSON.parse(raw) as ActivityEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: ActivityEntry[]): void {
  // Keep only the most recent entries
  const trimmed = entries.slice(-MAX_LOG_ENTRIES);
  fs.writeFileSync(LOG_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

/**
 * Log an admin activity.
 */
export function logActivity(
  action: ActivityAction,
  username: string,
  details: string,
  metadata?: Record<string, unknown>
): ActivityEntry {
  const entry: ActivityEntry = {
    id: randomBytes(4).toString("hex"),
    action,
    username,
    details,
    metadata,
    timestamp: new Date().toISOString(),
  };

  const log = readLog();
  log.push(entry);
  writeLog(log);

  return entry;
}

/**
 * Get recent activity log entries.
 */
export function getActivityLog(limit = 50, offset = 0): {
  entries: ActivityEntry[];
  total: number;
} {
  const log = readLog();
  // Return newest first
  const reversed = [...log].reverse();
  return {
    entries: reversed.slice(offset, offset + limit),
    total: log.length,
  };
}

/**
 * Get activity log for a specific user.
 */
export function getActivityByUser(username: string, limit = 50): ActivityEntry[] {
  const log = readLog();
  return log
    .filter((entry) => entry.username === username)
    .reverse()
    .slice(0, limit);
}
