# TCG Website Launch Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all admin API routes from broken filesystem JSON to Supabase, fix activity logging, harden security, and ensure the entire site works on Vercel for tomorrow's launch.

**Architecture:** The storefront already reads from Supabase correctly. The admin panel's API routes ALL use `fs.readFileSync`/`fs.writeFileSync` on local JSON files, which fails silently on Vercel's read-only filesystem. We migrate every admin route to use Supabase directly, matching the patterns already established in `lib/inventory.ts` and `lib/accessories.ts`. Activity logging moves to a Supabase `activity_log` table.

**Tech Stack:** Next.js 16, React 19, Supabase (PostgreSQL), TypeScript 5, Tailwind CSS 4, Vercel deployment.

---

## File Structure

### Files to Modify
- `lib/activity-log.ts` — rewrite from fs to Supabase
- `lib/orders.ts` — rewrite from fs to Supabase
- `lib/submissions.ts` — rewrite from fs to Supabase
- `app/api/admin/inventory/route.ts` — rewrite from fs to Supabase
- `app/api/admin/accessories/route.ts` — rewrite from fs to Supabase
- `app/api/admin/csv/route.ts` — rewrite from fs to Supabase
- `app/api/admin/bulk-price/route.ts` — rewrite from fs to Supabase
- `app/api/admin/activity/route.ts` — update to use async activity-log
- `app/api/admin/orders/route.ts` — update to use async orders lib
- `app/api/admin/submissions/route.ts` — update to use async submissions lib
- `app/api/admin/auth/login/route.ts` — update logActivity to async, harden cookie
- `lib/auth.ts` — remove hardcoded DEFAULT_ADMIN_USERS, harden cookie settings

### Files to Create
- `components/admin/ErrorBoundary.tsx` — React error boundary for admin pages

### Files NOT Changed
- `lib/inventory.ts` — already reads from Supabase (storefront, works fine)
- `lib/accessories.ts` — already reads from Supabase (storefront, works fine)
- `lib/supabase.ts` — already has correct client/service pattern
- `app/api/admin/backup/route.ts` — already reads from Supabase (works fine)

---

## Task 1: Create Supabase Tables for Activity Log

**Files:**
- Modify: `lib/activity-log.ts`
- Modify: `app/api/admin/activity/route.ts`

The activity_log table may or may not already exist in Supabase. The code should handle both cases.

- [ ] **Step 1: Rewrite `lib/activity-log.ts` to use Supabase**

Replace the entire file. Remove all `fs` imports. Make all functions async. Use `getServiceSupabase()` from `lib/supabase.ts`.

```typescript
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
```

- [ ] **Step 2: Update `app/api/admin/activity/route.ts` to use async**

```typescript
import { NextResponse } from "next/server";
import { getActivityLog } from "@/lib/activity-log";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await getActivityLog(limit, offset);
  return NextResponse.json(result);
}
```

- [ ] **Step 3: Create the `activity_log` table in Supabase if it doesn't exist**

Run this SQL via the Supabase MCP tool:
```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  username text NOT NULL,
  details text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_username ON activity_log (username);
```

- [ ] **Step 4: Commit**

```bash
git add lib/activity-log.ts app/api/admin/activity/route.ts
git commit -m "Migrate activity log from filesystem to Supabase"
```

---

## Task 2: Migrate Admin Inventory API to Supabase

**Files:**
- Modify: `app/api/admin/inventory/route.ts`

The admin inventory API currently reads/writes to `data/inventory.json`. It needs to use Supabase directly, matching the column names in the existing `inventory` table.

- [ ] **Step 1: Rewrite `app/api/admin/inventory/route.ts`**

Remove all `fs` and `path` imports. Use `getServiceSupabase()`. Keep `generateId` and `generateSlug` helpers. Make `logActivity` calls use `await`.

```typescript
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { CardCondition, CardEdition } from "@/lib/types";
import { CONDITION_SHORT } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getServiceSupabase } from "@/lib/supabase";

function generateId(
  setCode: string,
  condition: CardCondition,
  edition: CardEdition
): string {
  const condShort = CONDITION_SHORT[condition] || "UNK";
  const edShort = edition === "1st Edition" ? "1st" : edition === "Unlimited" ? "Unl" : "Ltd";
  const rand = randomBytes(2).toString("hex");
  return `${setCode}-${condShort}-${edShort}-${rand}`;
}

function generateSlug(cardName: string): string {
  return cardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("inventory")
      .select("*")
      .order("date_added", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e) {
    console.error("[admin/inventory] GET failed:", e);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const sb = getServiceSupabase();

    const id = generateId(body.setCode, body.condition, body.edition);
    const row = {
      id,
      card_name: body.cardName,
      set_code: body.setCode,
      set_name: body.setName,
      rarity: body.rarity,
      edition: body.edition,
      condition: body.condition,
      price: body.price,
      cost: body.cost || null,
      quantity: body.quantity,
      language: body.language || "English",
      date_added: new Date().toISOString().split("T")[0],
      game: body.game,
      slug: generateSlug(body.cardName),
      image_url: body.imageUrl || null,
      pricing_rule: body.pricingRule || null,
    };

    const { data, error } = await sb.from("inventory").insert(row).select().single();
    if (error) throw error;

    await logActivity("card_added", user?.username || "unknown", `Added "${body.cardName}" (${body.setCode})`, {
      itemId: id,
      cardName: body.cardName,
      price: body.price,
    });

    return NextResponse.json({ success: true, item: data }, { status: 201 });
  } catch (e) {
    console.error("[admin/inventory] POST failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to add item" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item id is required" },
        { status: 400 }
      );
    }

    const sb = getServiceSupabase();

    // Map camelCase to snake_case for Supabase
    const dbUpdates: Record<string, unknown> = {};
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
    if (updates.edition !== undefined) dbUpdates.edition = updates.edition;
    if (updates.cardName !== undefined) dbUpdates.card_name = updates.cardName;
    if (updates.setCode !== undefined) dbUpdates.set_code = updates.setCode;
    if (updates.setName !== undefined) dbUpdates.set_name = updates.setName;
    if (updates.rarity !== undefined) dbUpdates.rarity = updates.rarity;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.pricingRule !== undefined) dbUpdates.pricing_rule = updates.pricingRule;

    const { data, error } = await sb
      .from("inventory")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logActivity("card_updated", user?.username || "unknown", `Updated card (${id})`, {
      itemId: id,
      changes: updates,
    });

    return NextResponse.json({ success: true, item: data });
  } catch (e) {
    console.error("[admin/inventory] PUT failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to update item" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item id is required as query parameter" },
        { status: 400 }
      );
    }

    const sb = getServiceSupabase();

    // Get item name before deleting for the log
    const { data: item } = await sb.from("inventory").select("card_name").eq("id", id).single();

    const { error } = await sb.from("inventory").delete().eq("id", id);
    if (error) throw error;

    await logActivity("card_deleted", user?.username || "unknown", `Deleted "${item?.card_name || id}" (${id})`, {
      itemId: id,
      cardName: item?.card_name,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/inventory] DELETE failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/inventory/route.ts
git commit -m "Migrate admin inventory API from filesystem to Supabase"
```

---

## Task 3: Migrate Admin Accessories API to Supabase

**Files:**
- Modify: `app/api/admin/accessories/route.ts`

Same pattern as Task 2. Remove `fs`, use `getServiceSupabase()`.

- [ ] **Step 1: Rewrite `app/api/admin/accessories/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { AccessoryItem } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getServiceSupabase } from "@/lib/supabase";

function generateId(): string {
  return `ACC-${Date.now()}-${randomBytes(2).toString("hex")}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("accessories")
      .select("*")
      .order("date_added", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e) {
    console.error("[admin/accessories] GET failed:", e);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const sb = getServiceSupabase();

    const row = {
      id: generateId(),
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory || null,
      price: body.price,
      cost: body.cost != null ? body.cost : null,
      quantity: body.quantity,
      image_url: body.imageUrl || null,
      brand: body.brand || null,
      color: body.color || null,
      game: body.game || null,
      set_name: body.setName || null,
      date_added: new Date().toISOString().split("T")[0],
      slug: generateSlug(body.name),
    };

    const { data, error } = await sb.from("accessories").insert(row).select().single();
    if (error) throw error;

    await logActivity("accessory_added", user?.username || "unknown", `Added accessory "${body.name}"`, { itemId: row.id });

    return NextResponse.json({ success: true, item: data }, { status: 201 });
  } catch (e) {
    console.error("[admin/accessories] POST failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to add accessory" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item id is required" },
        { status: 400 }
      );
    }

    const sb = getServiceSupabase();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.game !== undefined) dbUpdates.game = updates.game;
    if (updates.setName !== undefined) dbUpdates.set_name = updates.setName;

    const { data, error } = await sb
      .from("accessories")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logActivity("accessory_updated", user?.username || "unknown", `Updated accessory (${id})`, { itemId: id, changes: updates });

    return NextResponse.json({ success: true, item: data });
  } catch (e) {
    console.error("[admin/accessories] PUT failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to update accessory" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item id is required as query parameter" },
        { status: 400 }
      );
    }

    const sb = getServiceSupabase();

    const { data: item } = await sb.from("accessories").select("name").eq("id", id).single();
    const { error } = await sb.from("accessories").delete().eq("id", id);
    if (error) throw error;

    await logActivity("accessory_deleted", user?.username || "unknown", `Deleted accessory "${item?.name || id}"`, { itemId: id });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/accessories] DELETE failed:", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete accessory" },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/accessories/route.ts
git commit -m "Migrate admin accessories API from filesystem to Supabase"
```

---

## Task 4: Migrate Orders to Supabase

**Files:**
- Modify: `lib/orders.ts`
- Modify: `app/api/admin/orders/route.ts`

- [ ] **Step 1: Rewrite `lib/orders.ts` to use Supabase**

Remove all `fs` imports. Make all functions async. Map camelCase to snake_case.

```typescript
import { randomBytes } from "crypto";
import type { Order, OrderStatus } from "./types";
import { getServiceSupabase } from "./supabase";

function mapRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    items: (row.items as Order["items"]) || [],
    customer: row.customer as Order["customer"],
    subtotal: Number(row.subtotal) || 0,
    shipping: Number(row.shipping) || 0,
    discount: Number(row.discount) || 0,
    total: Number(row.total) || 0,
    status: (row.status as OrderStatus) || "pending",
    notes: (row.notes as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  } catch (e) {
    console.error("[orders] getAllOrders failed:", e);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data ? mapRow(data) : undefined;
  } catch (e) {
    console.error("[orders] getOrderById failed:", e);
    return undefined;
  }
}

export async function createOrder(
  orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
): Promise<Order> {
  const sb = getServiceSupabase();
  const id = `ORD-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const row = {
    id,
    items: orderData.items,
    customer: orderData.customer,
    subtotal: orderData.subtotal,
    shipping: orderData.shipping,
    discount: orderData.discount,
    total: orderData.total,
    status: orderData.status,
    notes: orderData.notes || null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await sb.from("orders").insert(row).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const sb = getServiceSupabase();
  const now = new Date().toISOString();

  const { data, error } = await sb
    .from("orders")
    .update({ status, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error(`Order not found: ${id}`);
  return mapRow(data);
}
```

- [ ] **Step 2: Update `app/api/admin/orders/route.ts` to use async**

All calls to `getAllOrders()`, `createOrder()`, `updateOrderStatus()` need `await`. Also `logActivity` needs `await`.

```typescript
import { NextResponse } from "next/server";
import { getAllOrders, createOrder, updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export async function GET() {
  const orders = await getAllOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    if (!body.customer || !body.customer.name || !body.customer.email) {
      return NextResponse.json(
        { success: false, error: "Customer name and email are required" },
        { status: 400 }
      );
    }

    const order = await createOrder({
      items: body.items,
      customer: body.customer,
      subtotal: body.subtotal ?? 0,
      shipping: body.shipping ?? 0,
      discount: body.discount ?? 0,
      total: body.total ?? 0,
      status: body.status ?? "pending",
      notes: body.notes,
    });

    await logActivity("order_created", "customer", `New order from ${body.customer.name} ($${order.total.toFixed(2)})`, {
      orderId: order.id,
      customerEmail: body.customer.email,
      total: order.total,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order id is required" },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus(id, status);

    await logActivity("order_status_updated", user?.username || "unknown", `Updated order ${id} status to "${status}"`, {
      orderId: id,
      newStatus: status,
    });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body";
    const statusCode = message.includes("not found") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
```

- [ ] **Step 3: Create the `orders` table in Supabase if it doesn't exist**

```sql
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer jsonb NOT NULL,
  subtotal numeric(10,2) DEFAULT 0,
  shipping numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
```

- [ ] **Step 4: Commit**

```bash
git add lib/orders.ts app/api/admin/orders/route.ts
git commit -m "Migrate orders from filesystem to Supabase"
```

---

## Task 5: Migrate Submissions to Supabase

**Files:**
- Modify: `lib/submissions.ts`
- Modify: `app/api/admin/submissions/route.ts`

- [ ] **Step 1: Rewrite `lib/submissions.ts` to use Supabase**

```typescript
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
```

- [ ] **Step 2: Update `app/api/admin/submissions/route.ts` — make all calls async**

Read the current file and ensure all calls to `getAllSubmissions()`, `createSubmission()`, `updateSubmission()`, and `logActivity()` use `await`.

- [ ] **Step 3: Create the `submissions` table in Supabase if it doesn't exist**

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id text PRIMARY KEY,
  customer jsonb NOT NULL,
  description text NOT NULL DEFAULT '',
  estimated_value text,
  card_count integer,
  games jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  offer_amount numeric(10,2),
  admin_notes text,
  response_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at DESC);
```

- [ ] **Step 4: Commit**

```bash
git add lib/submissions.ts app/api/admin/submissions/route.ts
git commit -m "Migrate submissions from filesystem to Supabase"
```

---

## Task 6: Migrate CSV Upload to Supabase

**Files:**
- Modify: `app/api/admin/csv/route.ts`

- [ ] **Step 1: Rewrite `app/api/admin/csv/route.ts`**

Remove `fs` and `path` imports. Use `getServiceSupabase()` for batch inserts. Keep `parseCsvLine`, `generateId`, `generateSlug` helpers unchanged. For "replace" mode, delete all inventory rows first then insert. For "merge" mode, use upsert.

The key changes:
- Replace `readInventory()`/`writeInventory()` with Supabase queries
- Map InventoryItem fields to snake_case Supabase columns
- Use batch insert via `.insert(rows)`
- Make `logActivity` calls use `await`

```typescript
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
    let updated = 0;

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
      added = rows.length; // Simplified — upsert handles both
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/csv/route.ts
git commit -m "Migrate CSV upload from filesystem to Supabase"
```

---

## Task 7: Migrate Bulk Pricing to Supabase

**Files:**
- Modify: `app/api/admin/bulk-price/route.ts`

- [ ] **Step 1: Rewrite `app/api/admin/bulk-price/route.ts`**

Remove `fs` and `path` imports. Replace `readInventory()`/`writeInventory()` with Supabase queries. Keep `fetchMarketPrice()` and `calculateNewPrice()` unchanged. Update the apply phase to use individual Supabase updates instead of writing the full JSON.

Key changes:
- `readInventory()` becomes a Supabase `select("*")` query
- Individual price updates use `.update({ price }).eq("id", id)`
- `logActivity` calls use `await`

The code is long — the agent should keep all the existing pricing logic (fetchMarketPrice, calculateNewPrice, BulkPriceRequest, PriceChange interfaces) and only replace the data access layer. Specifically:
- Line 8-18: Remove `INVENTORY_FILE`, `readInventory`, `writeInventory`
- Line 121: Replace `readInventory()` with Supabase select
- Line 229-240: Replace file write with individual Supabase updates
- All `logActivity` calls need `await`

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/bulk-price/route.ts
git commit -m "Migrate bulk pricing from filesystem to Supabase"
```

---

## Task 8: Update All Callers of logActivity to Await

**Files:**
- Modify: `app/api/admin/auth/login/route.ts`

- [ ] **Step 1: Update login route**

Change `logActivity(...)` to `await logActivity(...)` and remove the try-catch wrapper around it (the function now handles errors internally).

In `app/api/admin/auth/login/route.ts`, replace lines 27-31:
```typescript
// Old:
try {
  logActivity("login", user.username, `${user.username} logged in (${user.role})`);
} catch {
  // Activity logging may fail on read-only filesystems (e.g., Vercel)
}

// New:
await logActivity("login", user.username, `${user.username} logged in (${user.role})`);
```

- [ ] **Step 2: Harden the auth cookie to SameSite=Strict**

In `app/api/admin/auth/login/route.ts`, change `sameSite: "lax"` to `sameSite: "strict"`.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/auth/login/route.ts
git commit -m "Update login to await async logActivity + harden cookie"
```

---

## Task 9: Security — Remove Hardcoded Credentials

**Files:**
- Modify: `lib/auth.ts`

- [ ] **Step 1: Remove DEFAULT_ADMIN_USERS array**

Remove the hardcoded plaintext credentials from `lib/auth.ts` lines 25-29. Change `getAdminUsers()` to return an empty array if Supabase is unavailable instead of falling back to hardcoded users. The team members are already in the Supabase `team` table from the recent migration.

Replace lines 24-29:
```typescript
// Old:
const DEFAULT_ADMIN_USERS: AdminUser[] = [
  { username: "spencer", password: "702cards2026", role: "owner", createdAt: "2026-03-21" },
  { username: "Damien", password: "Admin123", role: "owner", createdAt: "2026-03-22" },
  { username: "admin", password: "702admin2026", role: "editor", createdAt: "2026-03-21" },
];

// New (no fallback):
const DEFAULT_ADMIN_USERS: AdminUser[] = [];
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "Remove hardcoded plaintext credentials from auth"
```

---

## Task 10: Ensure Supabase Tables Exist

- [ ] **Step 1: Create all required tables**

Use the Supabase MCP tool to run the following SQL. The `inventory`, `accessories`, and `team` tables likely already exist. The others may need creation.

```sql
-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  username text NOT NULL,
  details text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log (timestamp DESC);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer jsonb NOT NULL,
  subtotal numeric(10,2) DEFAULT 0,
  shipping numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id text PRIMARY KEY,
  customer jsonb NOT NULL,
  description text NOT NULL DEFAULT '',
  estimated_value text,
  card_count integer,
  games jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  offer_amount numeric(10,2),
  admin_notes text,
  response_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status);

-- Reviews (if not exists)
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  card_name text,
  slug text,
  rating integer,
  title text,
  content text,
  author text,
  verified boolean DEFAULT false,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Backups metadata (if not exists)
CREATE TABLE IF NOT EXISTS backups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text NOT NULL,
  file_size integer,
  record_counts jsonb,
  created_by text,
  created_at timestamptz DEFAULT now()
);
```

- [ ] **Step 2: Verify existing tables have correct columns**

Query each table to ensure the columns match what the code expects:
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'inventory' ORDER BY ordinal_position;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'accessories' ORDER BY ordinal_position;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'team' ORDER BY ordinal_position;
```

---

## Task 11: Build and Verify

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Fix any build errors**

If there are TypeScript errors (e.g., sync functions now being async, missing await), fix them based on the error messages.

- [ ] **Step 3: Commit any build fixes**

```bash
git add -A
git commit -m "Fix build errors from Supabase migration"
```

---

## Task 12: Add Error Boundary for Admin Pages

**Files:**
- Create: `components/admin/ErrorBoundary.tsx`
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: Create `components/admin/ErrorBoundary.tsx`**

```tsx
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--color-danger)] mb-2">Something went wrong</h2>
          <p className="text-[var(--color-text-muted)] mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded bg-[var(--color-primary)] text-white hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap admin layout children with ErrorBoundary**

In `app/admin/layout.tsx`, import and wrap `{children}` with `<AdminErrorBoundary>`.

- [ ] **Step 3: Commit**

```bash
git add components/admin/ErrorBoundary.tsx app/admin/layout.tsx
git commit -m "Add error boundary for admin pages"
```
