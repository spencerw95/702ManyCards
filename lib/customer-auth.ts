import { createHmac, pbkdf2Sync, randomBytes } from "crypto";
import fs from "fs";
import path from "path";

export const CUSTOMER_COOKIE_NAME = "702mc_customer_session";
const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CUSTOMERS_FILE = path.join(process.cwd(), "data", "customers.json");

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Customer {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  address?: CustomerAddress;
  wishlist: string[]; // array of card slugs
  createdAt: string;
  updatedAt: string;
}

export type SafeCustomer = Omit<Customer, "passwordHash">;

function getSecret(): string {
  return process.env.AUTH_SECRET || "fallback-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// ── Password Hashing ──

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verify = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === verify;
}

// ── Token Management ──

export function createCustomerToken(id: string, email: string): string {
  const timestamp = Date.now().toString();
  const payload = `${id}:${email}:${timestamp}`;
  const signature = sign(payload);
  const token = `${payload}:${signature}`;
  return Buffer.from(token).toString("base64");
}

export function verifyCustomerToken(token: string): {
  valid: boolean;
  id?: string;
  email?: string;
} {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return { valid: false };

    const [id, email, timestamp, signature] = parts;
    if (!id || !email || !timestamp || !signature) return { valid: false };

    const payload = `${id}:${email}:${timestamp}`;
    const expectedSignature = sign(payload);
    if (signature !== expectedSignature) return { valid: false };

    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) return { valid: false };
    if (Date.now() - tokenTime > TOKEN_MAX_AGE_MS) return { valid: false };

    return { valid: true, id, email };
  } catch {
    return { valid: false };
  }
}

export function getCustomerFromRequest(request: Request): {
  id: string;
  email: string;
} | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${CUSTOMER_COOKIE_NAME}=([^;]+)`));
  if (match) {
    const result = verifyCustomerToken(match[1]);
    if (result.valid && result.id && result.email) {
      return { id: result.id, email: result.email };
    }
  }
  return null;
}

export async function getCustomerFromCookies(): Promise<{
  id: string;
  email: string;
} | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) return null;

    const result = verifyCustomerToken(token);
    if (!result.valid || !result.id || !result.email) return null;
    return { id: result.id, email: result.email };
  } catch {
    return null;
  }
}

// ── Customer CRUD ──

function readCustomers(): Customer[] {
  try {
    const raw = fs.readFileSync(CUSTOMERS_FILE, "utf-8");
    return JSON.parse(raw) as Customer[];
  } catch {
    return [];
  }
}

function writeCustomers(customers: Customer[]): void {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf-8");
}

function stripPassword(customer: Customer): SafeCustomer {
  const { passwordHash, ...safe } = customer;
  return safe;
}

export function getAllCustomers(): SafeCustomer[] {
  return readCustomers().map(stripPassword);
}

export function getCustomerById(id: string): SafeCustomer | undefined {
  const customer = readCustomers().find((c) => c.id === id);
  return customer ? stripPassword(customer) : undefined;
}

export function getCustomerByEmail(email: string): SafeCustomer | undefined {
  const customer = readCustomers().find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  return customer ? stripPassword(customer) : undefined;
}

/** Internal: get with password for auth verification */
function getCustomerByEmailWithPassword(email: string): Customer | undefined {
  return readCustomers().find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
}

export function authenticateCustomer(
  email: string,
  password: string
): SafeCustomer | null {
  const customer = getCustomerByEmailWithPassword(email);
  if (!customer) return null;
  if (!verifyPassword(password, customer.passwordHash)) return null;
  return stripPassword(customer);
}

export function createCustomer(
  email: string,
  password: string,
  name: string
): SafeCustomer {
  const customers = readCustomers();

  // Check duplicate
  if (customers.find((c) => c.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already registered");
  }

  const id = `CUS-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const newCustomer: Customer = {
    id,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name,
    wishlist: [],
    createdAt: now,
    updatedAt: now,
  };

  customers.push(newCustomer);
  writeCustomers(customers);
  return stripPassword(newCustomer);
}

export function updateCustomer(
  id: string,
  updates: Partial<Pick<Customer, "name" | "phone" | "address" | "wishlist">>
): SafeCustomer {
  const customers = readCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Customer not found");

  if (updates.name !== undefined) customers[index].name = updates.name;
  if (updates.phone !== undefined) customers[index].phone = updates.phone;
  if (updates.address !== undefined) customers[index].address = updates.address;
  if (updates.wishlist !== undefined) customers[index].wishlist = updates.wishlist;
  customers[index].updatedAt = new Date().toISOString();

  writeCustomers(customers);
  return stripPassword(customers[index]);
}

export function changeCustomerPassword(
  id: string,
  currentPassword: string,
  newPassword: string
): boolean {
  const customers = readCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) return false;

  if (!verifyPassword(currentPassword, customers[index].passwordHash)) {
    return false;
  }

  customers[index].passwordHash = hashPassword(newPassword);
  customers[index].updatedAt = new Date().toISOString();
  writeCustomers(customers);
  return true;
}

/** Reset password by email (no old password required — for password reset flow) */
export function resetPasswordByEmail(
  email: string,
  newPassword: string
): boolean {
  const customers = readCustomers();
  const index = customers.findIndex(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  if (index === -1) return false;

  customers[index].passwordHash = hashPassword(newPassword);
  customers[index].updatedAt = new Date().toISOString();
  writeCustomers(customers);
  return true;
}
