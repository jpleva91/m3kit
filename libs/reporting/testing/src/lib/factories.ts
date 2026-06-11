/**
 * Synthetic data factories for the five demo domains: customers, orders,
 * invoices, support tickets, and products.
 *
 * All values are obviously synthetic ("Customer 0042", "Acme Corp 12",
 * round amounts, seed-derived ISO dates) and fully deterministic: the same
 * seed always produces the same row.
 */
import { createSeededRandom } from './seeded-random';

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type CustomerSegment = 'smb' | 'mid-market' | 'enterprise';

export interface Customer {
  readonly id: string;
  readonly customerName: string;
  readonly companyName: string;
  readonly email: string;
  readonly segment: CustomerSegment;
  readonly creditLimit: number;
  readonly createdAt: string;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerName: string;
  readonly itemCount: number;
  readonly amount: number;
  readonly currency: string;
  readonly status: OrderStatus;
  readonly placedAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface Invoice {
  readonly id: string;
  readonly number: string;
  readonly customerName: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: InvoiceStatus;
  readonly issuedAt: string;
  readonly dueAt: string;
}

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface SupportTicket {
  readonly id: string;
  readonly subject: string;
  readonly customerName: string;
  readonly priority: SupportTicketPriority;
  readonly status: SupportTicketStatus;
  readonly openedAt: string;
}

export type ProductStatus = 'active' | 'discontinued';

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly category: string;
  readonly unitPrice: number;
  readonly stockCount: number;
  readonly status: ProductStatus;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const CUSTOMER_SEGMENTS: readonly CustomerSegment[] = ['smb', 'mid-market', 'enterprise'];
const ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'shipped', 'delivered', 'cancelled'];
const INVOICE_STATUSES: readonly InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'void'];
const TICKET_PRIORITIES: readonly SupportTicketPriority[] = ['low', 'medium', 'high', 'urgent'];
const TICKET_STATUSES: readonly SupportTicketStatus[] = ['open', 'in-progress', 'resolved', 'closed'];
const PRODUCT_CATEGORIES: readonly string[] = ['Hardware', 'Software', 'Services', 'Accessories'];
const PRODUCT_STATUSES: readonly ProductStatus[] = ['active', 'discontinued'];

/** Epoch for all synthetic dates: 2026-01-01T00:00:00Z. */
const BASE_DATE_MS = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Zero-pads a non-negative integer to four digits (`42` → `'0042'`). */
function pad4(value: number): string {
  return String(value).padStart(4, '0');
}

/** ISO timestamp `daysOffset` days after the synthetic base date. */
function isoDate(daysOffset: number): string {
  return new Date(BASE_DATE_MS + daysOffset * DAY_MS).toISOString();
}

function makeMany<T>(count: number, seed: number, factory: (seedOrIndex: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => factory(seed + i));
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

/** Builds one deterministic synthetic customer from a seed/index. */
export function makeCustomer(seedOrIndex: number): Customer {
  const rng = createSeededRandom(seedOrIndex);
  const n = pad4(seedOrIndex);
  return {
    id: `CUS-${n}`,
    customerName: `Customer ${n}`,
    companyName: `Acme Corp ${seedOrIndex}`,
    email: `customer${n}@example.com`,
    segment: rng.pick(CUSTOMER_SEGMENTS),
    creditLimit: rng.nextInt(1, 40) * 500,
    createdAt: isoDate(rng.nextInt(0, 120)),
  };
}

/** Builds `count` deterministic customers starting at `seed`. */
export function makeCustomers(count: number, seed = 1): Customer[] {
  return makeMany(count, seed, makeCustomer);
}

/** Builds one deterministic synthetic order from a seed/index. */
export function makeOrder(seedOrIndex: number): Order {
  const rng = createSeededRandom(seedOrIndex);
  const n = pad4(seedOrIndex);
  return {
    id: `ORD-${n}`,
    orderNumber: `ORD-2026-${n}`,
    customerName: `Customer ${pad4(rng.nextInt(1, 200))}`,
    itemCount: rng.nextInt(1, 12),
    amount: rng.nextInt(1, 80) * 25,
    currency: 'USD',
    status: rng.pick(ORDER_STATUSES),
    placedAt: isoDate(rng.nextInt(0, 150)),
  };
}

/** Builds `count` deterministic orders starting at `seed`. */
export function makeOrders(count: number, seed = 1): Order[] {
  return makeMany(count, seed, makeOrder);
}

/** Builds one deterministic synthetic invoice from a seed/index. */
export function makeInvoice(seedOrIndex: number): Invoice {
  const rng = createSeededRandom(seedOrIndex);
  const n = pad4(seedOrIndex);
  const issuedOffset = rng.nextInt(0, 150);
  return {
    id: `INV-${n}`,
    number: `INV-2026-${n}`,
    customerName: `Customer ${pad4(rng.nextInt(1, 200))}`,
    amount: rng.nextInt(1, 200) * 25,
    currency: 'USD',
    status: rng.pick(INVOICE_STATUSES),
    issuedAt: isoDate(issuedOffset),
    dueAt: isoDate(issuedOffset + 30),
  };
}

/** Builds `count` deterministic invoices starting at `seed`. */
export function makeInvoices(count: number, seed = 1): Invoice[] {
  return makeMany(count, seed, makeInvoice);
}

/** Builds one deterministic synthetic support ticket from a seed/index. */
export function makeSupportTicket(seedOrIndex: number): SupportTicket {
  const rng = createSeededRandom(seedOrIndex);
  const n = pad4(seedOrIndex);
  return {
    id: `TKT-${n}`,
    subject: `Support request ${n}`,
    customerName: `Customer ${pad4(rng.nextInt(1, 200))}`,
    priority: rng.pick(TICKET_PRIORITIES),
    status: rng.pick(TICKET_STATUSES),
    openedAt: isoDate(rng.nextInt(0, 150)),
  };
}

/** Builds `count` deterministic support tickets starting at `seed`. */
export function makeSupportTickets(count: number, seed = 1): SupportTicket[] {
  return makeMany(count, seed, makeSupportTicket);
}

/** Builds one deterministic synthetic product from a seed/index. */
export function makeProduct(seedOrIndex: number): Product {
  const rng = createSeededRandom(seedOrIndex);
  const n = pad4(seedOrIndex);
  return {
    id: `PRD-${n}`,
    name: `Product ${n}`,
    sku: `SKU-${n}`,
    category: rng.pick(PRODUCT_CATEGORIES),
    unitPrice: rng.nextInt(1, 100) * 5,
    stockCount: rng.nextInt(0, 500),
    status: rng.pick(PRODUCT_STATUSES),
  };
}

/** Builds `count` deterministic products starting at `seed`. */
export function makeProducts(count: number, seed = 1): Product[] {
  return makeMany(count, seed, makeProduct);
}
