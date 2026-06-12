import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { InMemoryTableDataSource, TableDefinition } from '@m3kit/core';

import { DataTableComponent } from './data-table.component';

interface InvoiceRow {
  readonly id: string;
  readonly customerName: string;
  readonly amount: number;
  readonly status: 'draft' | 'sent' | 'paid' | 'overdue';
}

const STATUSES: readonly InvoiceRow['status'][] = ['draft', 'sent', 'paid', 'overdue'];

function makeInvoices(count: number): InvoiceRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `INV-${String(i + 1).padStart(4, '0')}`,
    customerName: `Acme Corp ${i + 1}`,
    amount: (i + 1) * 110.5,
    status: STATUSES[i % STATUSES.length],
  }));
}

const INVOICE_DEFINITION: TableDefinition<InvoiceRow> = {
  id: 'invoices',
  title: 'Invoices',
  defaultPageSize: 5,
  columns: [
    { key: 'id', header: 'Invoice', type: 'text', sortable: true },
    { key: 'customerName', header: 'Customer', type: 'text', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      type: 'currency',
      sortable: true,
      align: 'end',
      format: { currencyCode: 'USD', digitsInfo: '1.2-2' },
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      format: {
        badgeColors: { draft: 'default', sent: 'info', paid: 'success', overdue: 'warn' },
      },
    },
  ],
};

@Component({
  imports: [DataTableComponent],
  template: `<m3k-data-table [definition]="definition" [dataSource]="dataSource" />`,
})
class DataTableHostComponent {
  readonly definition = INVOICE_DEFINITION;
  readonly dataSource = new InMemoryTableDataSource<InvoiceRow>(makeInvoices(12));
}

describe(DataTableComponent.name, () => {
  beforeEach(() => {
    cy.mount(DataTableHostComponent, {
      providers: [provideNoopAnimations()],
    });
  });

  it('renders one row per record of the first page', () => {
    cy.get('tr.m3k-data-table__row').should('have.length', 5);
    cy.get('tr.m3k-data-table__row').first().should('contain.text', 'INV-0001');
    cy.get('tr.m3k-data-table__row').first().should('contain.text', 'Acme Corp 1');
  });

  it('re-orders rows when a sortable header is clicked', () => {
    // First click sorts ascending (same as insertion order), second descending.
    cy.get('th').contains('Invoice').click();
    cy.get('th').contains('Invoice').click();
    cy.get('tr.m3k-data-table__row').first().should('contain.text', 'INV-0012');
  });

  it('shows the next page when the paginator advances', () => {
    cy.get('.mat-mdc-paginator-navigation-next').click();
    cy.get('tr.m3k-data-table__row').first().should('contain.text', 'INV-0006');
    cy.get('tr.m3k-data-table__row').should('have.length', 5);
  });

  it('renders badge cells with their configured color tokens', () => {
    cy.get('span.m3k-badge[data-color="warn"]').should('contain.text', 'overdue');
    cy.get('span.m3k-badge[data-color="success"]').should('contain.text', 'paid');
    cy.get('span.m3k-badge[data-color="default"]').should('contain.text', 'draft');
  });
});
