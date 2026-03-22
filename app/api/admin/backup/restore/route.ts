import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

const VALID_TABLES = [
  "inventory",
  "accessories",
  "customers",
  "orders",
  "team",
  "submissions",
  "reviews",
  "activity_log",
];

interface BackupFile {
  metadata: {
    version: string;
    exportDate: string;
    recordCounts: Record<string, number>;
    totalRecords: number;
  };
  data: Record<string, Record<string, unknown>[]>;
}

function validateBackup(body: unknown): { valid: boolean; error?: string; backup?: BackupFile } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid backup format: not a JSON object" };
  }

  const obj = body as Record<string, unknown>;

  if (!obj.metadata || typeof obj.metadata !== "object") {
    return { valid: false, error: "Invalid backup format: missing metadata" };
  }

  const meta = obj.metadata as Record<string, unknown>;
  if (!meta.version || !meta.exportDate || !meta.recordCounts) {
    return { valid: false, error: "Invalid backup format: incomplete metadata" };
  }

  if (!obj.data || typeof obj.data !== "object") {
    return { valid: false, error: "Invalid backup format: missing data section" };
  }

  const data = obj.data as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    if (!VALID_TABLES.includes(key)) {
      return { valid: false, error: `Invalid backup format: unknown table "${key}"` };
    }
    if (!Array.isArray(data[key])) {
      return { valid: false, error: `Invalid backup format: table "${key}" is not an array` };
    }
  }

  return { valid: true, backup: body as BackupFile };
}

export async function POST(request: NextRequest) {
  // Auth check - only owners can restore
  const user = await getUserFromCookies();
  if (!user || user.role !== "owner") {
    return NextResponse.json(
      { error: "Unauthorized. Only owners can restore backups." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { mode } = Object.fromEntries(new URL(request.url).searchParams);
    const restoreMode = mode === "replace" ? "replace" : "merge";

    // Validate the backup structure
    const validation = validateBackup(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const backup = validation.backup!;
    const sb = getServiceSupabase();
    const summary: Record<string, { inserted: number; skipped: number; errors: string[] }> = {};

    for (const [table, rows] of Object.entries(backup.data)) {
      if (!VALID_TABLES.includes(table)) continue;
      if (!rows || rows.length === 0) {
        summary[table] = { inserted: 0, skipped: 0, errors: [] };
        continue;
      }

      const tableResult = { inserted: 0, skipped: 0, errors: [] as string[] };

      if (restoreMode === "replace") {
        // Clear existing data in the table
        const { error: deleteError } = await sb.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (deleteError) {
          tableResult.errors.push(`Failed to clear table: ${deleteError.message}`);
        }

        // Insert all rows
        const { error: insertError, data: inserted } = await sb
          .from(table)
          .insert(rows)
          .select("id");
        if (insertError) {
          tableResult.errors.push(`Failed to insert: ${insertError.message}`);
        } else {
          tableResult.inserted = inserted?.length || 0;
        }
      } else {
        // Merge mode: upsert rows (add missing, update existing based on id)
        const BATCH_SIZE = 100;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          const { error: upsertError, data: upserted } = await sb
            .from(table)
            .upsert(batch, { onConflict: "id" })
            .select("id");
          if (upsertError) {
            tableResult.errors.push(
              `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${upsertError.message}`
            );
          } else {
            tableResult.inserted += upserted?.length || 0;
          }
        }
      }

      summary[table] = tableResult;
    }

    return NextResponse.json({
      success: true,
      mode: restoreMode,
      summary,
      restoredAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Backup restore error:", err);
    return NextResponse.json(
      { error: "Failed to restore backup. Check the file format." },
      { status: 500 }
    );
  }
}
