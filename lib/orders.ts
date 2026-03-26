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
