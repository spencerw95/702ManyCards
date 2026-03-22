import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

const BACKUP_VERSION = "1.0.0";

// Tables to export and columns to exclude for privacy
const TABLES_CONFIG: Record<string, { excludeColumns?: string[] }> = {
  inventory: {},
  accessories: {},
  customers: { excludeColumns: ["password_hash", "password"] },
  orders: {},
  team: { excludeColumns: ["password_hash", "password"] },
  submissions: {},
  reviews: {},
  activity_log: {},
};

export async function GET() {
  // Auth check
  const user = await getUserFromCookies();
  if (!user || user.role !== "owner") {
    return NextResponse.json(
      { error: "Unauthorized. Only owners can create backups." },
      { status: 403 }
    );
  }

  try {
    const sb = getServiceSupabase();
    const exportData: Record<string, unknown[]> = {};
    const recordCounts: Record<string, number> = {};

    for (const [table, config] of Object.entries(TABLES_CONFIG)) {
      const { data, error } = await sb.from(table).select("*");

      if (error) {
        console.error(`Backup: error fetching ${table}:`, error.message);
        exportData[table] = [];
        recordCounts[table] = 0;
        continue;
      }

      let rows = data || [];

      // Strip sensitive columns
      if (config.excludeColumns && config.excludeColumns.length > 0) {
        rows = rows.map((row) => {
          const clean = { ...row };
          for (const col of config.excludeColumns!) {
            delete clean[col];
          }
          return clean;
        });
      }

      exportData[table] = rows;
      recordCounts[table] = rows.length;
    }

    const backup = {
      metadata: {
        version: BACKUP_VERSION,
        exportDate: new Date().toISOString(),
        recordCounts,
        totalRecords: Object.values(recordCounts).reduce((a, b) => a + b, 0),
      },
      data: exportData,
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const fileSize = new Blob([jsonString]).size;
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `702manycards-backup-${dateStr}.json`;

    // Log the backup in the backups table
    await sb.from("backups").insert({
      file_name: fileName,
      file_size: fileSize,
      record_counts: recordCounts,
      created_by: user.username,
    });

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Backup export error:", err);
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}
