import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { Order, OrderStatus } from "./types";

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

function readOrders(): Order[] {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]): void {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

/**
 * Get all orders.
 */
export function getAllOrders(): Order[] {
  return readOrders();
}

/**
 * Get a single order by ID.
 */
export function getOrderById(id: string): Order | undefined {
  return readOrders().find((order) => order.id === id);
}

/**
 * Create a new order. Generates ID and timestamps automatically.
 */
export function createOrder(
  orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
): Order {
  const orders = readOrders();
  const id = `ORD-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    ...orderData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  orders.push(newOrder);
  writeOrders(orders);
  return newOrder;
}

/**
 * Update the status of an existing order.
 */
export function updateOrderStatus(id: string, status: OrderStatus): Order {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) {
    throw new Error(`Order not found: ${id}`);
  }

  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();

  writeOrders(orders);
  return orders[index];
}
