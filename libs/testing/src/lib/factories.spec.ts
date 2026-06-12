import {
  makeCustomer,
  makeCustomers,
  makeInvoice,
  makeInvoices,
  makeOrder,
  makeOrders,
  makeProduct,
  makeProducts,
  makeSupportTicket,
  makeSupportTickets,
} from './factories';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('synthetic data factories', () => {
  describe('determinism', () => {
    it('same seed produces identical rows', () => {
      expect(makeCustomer(42)).toEqual(makeCustomer(42));
      expect(makeOrder(42)).toEqual(makeOrder(42));
      expect(makeInvoice(42)).toEqual(makeInvoice(42));
      expect(makeSupportTicket(42)).toEqual(makeSupportTicket(42));
      expect(makeProduct(42)).toEqual(makeProduct(42));
    });

    it('same seed produces identical collections', () => {
      expect(makeCustomers(20, 7)).toEqual(makeCustomers(20, 7));
      expect(makeOrders(20, 7)).toEqual(makeOrders(20, 7));
      expect(makeInvoices(20, 7)).toEqual(makeInvoices(20, 7));
      expect(makeSupportTickets(20, 7)).toEqual(makeSupportTickets(20, 7));
      expect(makeProducts(20, 7)).toEqual(makeProducts(20, 7));
    });

    it('different seeds produce different collections', () => {
      expect(makeInvoices(20, 1)).not.toEqual(makeInvoices(20, 1000));
    });
  });

  describe('count', () => {
    it('makeXs(count) returns exactly count rows', () => {
      expect(makeCustomers(13)).toHaveLength(13);
      expect(makeOrders(13)).toHaveLength(13);
      expect(makeInvoices(13)).toHaveLength(13);
      expect(makeSupportTickets(13)).toHaveLength(13);
      expect(makeProducts(13)).toHaveLength(13);
      expect(makeInvoices(0)).toHaveLength(0);
    });

    it('rows within a collection have unique ids', () => {
      const ids = makeInvoices(50).map((invoice) => invoice.id);
      expect(new Set(ids).size).toBe(50);
    });
  });

  describe('shape', () => {
    it('customers have obviously synthetic values', () => {
      const customer = makeCustomer(42);
      expect(customer.id).toBe('CUS-0042');
      expect(customer.customerName).toBe('Customer 0042');
      expect(customer.companyName).toBe('Acme Corp 42');
      expect(customer.email).toBe('customer0042@example.com');
      expect(['smb', 'mid-market', 'enterprise']).toContain(customer.segment);
      expect(customer.creditLimit % 500).toBe(0);
      expect(customer.createdAt).toMatch(ISO_DATE);
    });

    it('orders have round amounts and valid statuses', () => {
      const order = makeOrder(7);
      expect(order.id).toBe('ORD-0007');
      expect(order.orderNumber).toBe('ORD-2026-0007');
      expect(order.customerName).toMatch(/^Customer \d{4}$/);
      expect(order.itemCount).toBeGreaterThanOrEqual(1);
      expect(order.amount % 25).toBe(0);
      expect(order.currency).toBe('USD');
      expect(['pending', 'shipped', 'delivered', 'cancelled']).toContain(order.status);
      expect(order.placedAt).toMatch(ISO_DATE);
    });

    it('invoices have the documented shape and dueAt 30 days after issuedAt', () => {
      const invoice = makeInvoice(1);
      expect(invoice.id).toBe('INV-0001');
      expect(invoice.number).toBe('INV-2026-0001');
      expect(invoice.customerName).toMatch(/^Customer \d{4}$/);
      expect(invoice.amount % 25).toBe(0);
      expect(invoice.currency).toBe('USD');
      expect(['draft', 'sent', 'paid', 'overdue', 'void']).toContain(invoice.status);
      expect(invoice.issuedAt).toMatch(ISO_DATE);
      expect(invoice.dueAt).toMatch(ISO_DATE);
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(Date.parse(invoice.dueAt) - Date.parse(invoice.issuedAt)).toBe(thirtyDaysMs);
    });

    it('support tickets have valid priority and status', () => {
      const ticket = makeSupportTicket(9);
      expect(ticket.id).toBe('TKT-0009');
      expect(ticket.subject).toBe('Support request 0009');
      expect(ticket.customerName).toMatch(/^Customer \d{4}$/);
      expect(['low', 'medium', 'high', 'urgent']).toContain(ticket.priority);
      expect(['open', 'in-progress', 'resolved', 'closed']).toContain(ticket.status);
      expect(ticket.openedAt).toMatch(ISO_DATE);
    });

    it('products have round prices and known categories', () => {
      const product = makeProduct(3);
      expect(product.id).toBe('PRD-0003');
      expect(product.name).toBe('Product 0003');
      expect(product.sku).toBe('SKU-0003');
      expect(['Hardware', 'Software', 'Services', 'Accessories']).toContain(product.category);
      expect(product.unitPrice % 5).toBe(0);
      expect(product.stockCount).toBeGreaterThanOrEqual(0);
      expect(['active', 'discontinued']).toContain(product.status);
    });
  });
});
