import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { CardCondition, CardEdition, TCGGame } from "@/lib/types";
import { CONDITION_SHORT } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getServiceSupabase } from "@/lib/supabase";

function generateId(setCode: string, condition: CardCondition, edition: CardEdition): string {
  const condShort = CONDITION_SHORT[condition] || "UNK";
  const edShort = edition === "1st Edition" ? "1st" : edition === "Unlimited" ? "Unl" : "Ltd";
  const rand = randomBytes(2).toString("hex");
  return `${setCode}-${condShort}-${edShort}-${rand}`;
}

function generateSlug(cardName: string): string {
  return cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "replace";

    if (!file) {
      return NextResponse.json({ success: false, error: "No CSV file provided" }, { status: 400 });
    }
    if (mode !== "replace" && mode !== "merge") {
      return NextResponse.json({ success: false, error: "Mode must be 'replace' or 'merge'" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const expectedColumns = ["cardname", "setcode", "setname", "rarity", "edition", "condition", "price", "quantity", "language", "game", "imageurl"];
    const colIndex: Record<string, number> = {};
    for (const col of expectedColumns) {
      colIndex[col] = headers.indexOf(col);
    }

    const today = new Date().toISOString().split("T")[0];
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvLine(lines[i]);

      const cardName = colIndex.cardname >= 0 ? fields[colIndex.cardname] : "";
      const setCode = colIndex.setcode >= 0 ? fields[colIndex.setcode] : "";
      const setName = colIndex.setname >= 0 ? fields[colIndex.setname] : "";
      const rarity = colIndex.rarity >= 0 ? fields[colIndex.rarity] : "";
      const edition = (colIndex.edition >= 0 ? fields[colIndex.edition] : "Unlimited") as CardEdition;
      const condition = (colIndex.condition >= 0 ? fields[colIndex.condition] : "Near Mint") as CardCondition;
      const price = colIndex.price >= 0 ? parseFloat(fields[colIndex.price]) || 0 : 0;
      const quantity = colIndex.quantity >= 0 ? parseInt(fields[colIndex.quantity], 10) || 0 : 0;
      const language = colIndex.language >= 0 ? fields[colIndex.language] : "English";
      const game = (colIndex.game >= 0 ? fields[colIndex.game] : "yugioh") as TCGGame;
      const imageUrl = colIndex.imageurl >= 0 ? fields[colIndex.imageurl] : "";

      if (!cardName) continue;

      rows.push({
        id: generateId(setCode, condition, edition),
        card_name: cardName,
        set_code: setCode,
        set_name: setName,
        rarity,
        edition,
        condition,
        price,
        quantity,
        language: language || "English",
        date_added: today,
        game,
        slug: generateSlug(cardName),
        image_url: imageUrl || null,
      });
    }

    const sb = getServiceSupabase();
    let added = 0;
    const updated = 0;

    if (mode === "replace") {
      // Delete all existing inventory, then insert new
      await sb.from("inventory").delete().neq("id", "");
      if (rows.length > 0) {
        const { error } = await sb.from("inventory").insert(rows);
        if (error) throw error;
      }
      added = rows.length;
    } else {
      // Merge mode: upsert
      if (rows.length > 0) {
        const { error } = await sb.from("inventory").upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }
      added = rows.length;
    }

    // Get total count
    const { count } = await sb.from("inventory").select("*", { count: "exact", head: true });
    const total = count || 0;

    const user = getUserFromRequest(request);
    await logActivity("csv_uploaded", user?.username || "unknown", `CSV upload (${mode}): ${added} added, ${updated} updated, ${total} total`, {
      mode, added, updated, total,
    });

    return NextResponse.json({ success: true, added, updated, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process CSV";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
