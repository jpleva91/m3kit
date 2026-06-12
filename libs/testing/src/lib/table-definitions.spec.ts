import { makeCustomer, makeInvoice } from './factories';
import { CUSTOMERS_TABLE_DEFINITION, INVOICES_TABLE_DEFINITION } from './table-definitions';

describe('report definition fixtures', () => {
  it('invoices definition has a stable id and at least one column', () => {
    expect(INVOICES_TABLE_DEFINITION.id).toBe('demo-invoices');
    expect(INVOICES_TABLE_DEFINITION.columns.length).toBeGreaterThan(0);
  });

  it('customers definition has a stable id and at least one column', () => {
    expect(CUSTOMERS_TABLE_DEFINITION.id).toBe('demo-customers');
    expect(CUSTOMERS_TABLE_DEFINITION.columns.length).toBeGreaterThan(0);
  });

  it('every invoice column key exists on factory-built invoices', () => {
    const invoice = makeInvoice(1);
    for (const column of INVOICES_TABLE_DEFINITION.columns) {
      expect(invoice).toHaveProperty(column.key);
    }
  });

  it('every customer column key exists on factory-built customers', () => {
    const customer = makeCustomer(1);
    for (const column of CUSTOMERS_TABLE_DEFINITION.columns) {
      expect(customer).toHaveProperty(column.key);
    }
  });

  it('default sort keys refer to declared columns', () => {
    const invoiceKeys = INVOICES_TABLE_DEFINITION.columns.map((c) => c.key);
    const customerKeys = CUSTOMERS_TABLE_DEFINITION.columns.map((c) => c.key);
    expect(invoiceKeys).toContain(INVOICES_TABLE_DEFINITION.defaultSort?.key);
    expect(customerKeys).toContain(CUSTOMERS_TABLE_DEFINITION.defaultSort?.key);
  });

  it('badge columns declare a color for every factory-producible status', () => {
    const statusColumn = INVOICES_TABLE_DEFINITION.columns.find((c) => c.key === 'status');
    const colors = statusColumn?.format?.badgeColors ?? {};
    for (const status of ['draft', 'sent', 'paid', 'overdue', 'void']) {
      expect(colors[status]).toBeDefined();
    }
  });
});
