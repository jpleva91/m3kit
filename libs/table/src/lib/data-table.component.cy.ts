import { Component, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs';
import {
  ColumnViewState,
  InMemoryTableDataSource,
  PageState,
  SortState,
  TableDataSource,
  TableDefinition,
  DataPage,
  DataQuery,
} from '@m3kit/core';

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
    { key: 'id', header: 'Invoice', type: 'text', sortable: true, width: '8rem' },
    { key: 'customerName', header: 'Customer', type: 'text', sortable: true, width: '28rem' },
    {
      key: 'amount',
      header: 'Amount',
      type: 'currency',
      sortable: true,
      align: 'end',
      width: '10rem',
      format: { currencyCode: 'USD', digitsInfo: '1.2-2' },
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      width: '12rem',
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

const PINNED_COLUMN_STATE: readonly ColumnViewState[] = [
  { key: 'id', pinned: 'start', width: '8rem' },
  { key: 'customerName', width: '32rem' },
  { key: 'amount', pinned: 'end', width: '10rem' },
  { key: 'status', visible: false },
];

@Component({
  imports: [DataTableComponent],
  template: `
    <div style="width: 360px">
      <m3k-data-table
        [definition]="definition"
        [dataSource]="dataSource"
        [columnState]="columnState"
      />
    </div>
  `,
})
class ColumnStateDataTableHostComponent {
  readonly definition = INVOICE_DEFINITION;
  readonly dataSource = new InMemoryTableDataSource<InvoiceRow>(makeInvoices(12));
  readonly columnState = PINNED_COLUMN_STATE;
}

describe(`${DataTableComponent.name} columnState`, () => {
  beforeEach(() => {
    cy.mount(ColumnStateDataTableHostComponent, {
      providers: [provideNoopAnimations()],
    });
  });

  it('keeps pinned columns at their edges while horizontally scrolled and hides omitted cells', () => {
    cy.contains('th', 'Status').should('not.exist');
    cy.get('td.cdk-column-status').should('not.exist');

    cy.get('th.cdk-column-id').then(($id) => {
      const before = $id[0].getBoundingClientRect();
      cy.get('.m3k-data-table__scroll').scrollTo('right');
      cy.get('th.cdk-column-id').should(($scrolledId) => {
        expect($scrolledId[0].getBoundingClientRect().left).to.be.closeTo(before.left, 2);
      });
    });

    cy.get('.m3k-data-table__scroll').then(($scroll) => {
      const scrollRight = $scroll[0].getBoundingClientRect().right;
      cy.get('th.cdk-column-amount').should(($amount) => {
        expect($amount[0].getBoundingClientRect().right).to.be.closeTo(scrollRight, 2);
      });
    });
  });
});

/** Counts fetches so the controlled-mode tests can prove there are none. */
class CountingDataSource implements TableDataSource<InvoiceRow> {
  fetches = 0;

  constructor(private readonly inner: TableDataSource<InvoiceRow>) {}

  fetch(query: DataQuery): Observable<DataPage<InvoiceRow>> {
    this.fetches += 1;
    return this.inner.fetch(query);
  }
}

@Component({
  imports: [DataTableComponent],
  template: `
    <m3k-data-table
      [definition]="definition"
      [dataSource]="dataSource"
      [rows]="rows()"
      [loading]="false"
      [error]="null"
      [totalCount]="42"
      [sort]="sort()"
      [page]="page()"
      (sortChange)="lastSort.set($event)"
      (pageChange)="lastPage.set($event)"
    />
    <p data-cy="last-sort">{{ lastSort()?.key }} {{ lastSort()?.direction }}</p>
    <p data-cy="last-page">{{ lastPage()?.index }} {{ lastPage()?.size }}</p>
  `,
})
class ControlledDataTableHostComponent {
  readonly definition = INVOICE_DEFINITION;
  readonly dataSource = new CountingDataSource(
    new InMemoryTableDataSource<InvoiceRow>(makeInvoices(12)),
  );
  readonly rows = signal<readonly InvoiceRow[]>(makeInvoices(3));
  readonly sort = signal<SortState | null>(null);
  readonly page = signal<PageState>({ index: 0, size: 5 });
  readonly lastSort = signal<SortState | null>(null);
  readonly lastPage = signal<PageState | null>(null);
}

describe(`${DataTableComponent.name} (controlled mode)`, () => {
  let host: ControlledDataTableHostComponent;

  beforeEach(() => {
    cy.mount(ControlledDataTableHostComponent, {
      providers: [provideNoopAnimations()],
    }).then(({ component }) => {
      host = component;
    });
  });

  it('renders the provided rows without fetching from the data source', () => {
    cy.get('tr.m3k-data-table__row').should('have.length', 3);
    cy.get('tr.m3k-data-table__row').first().should('contain.text', 'INV-0001');
    cy.then(() => expect(host.dataSource.fetches).to.eq(0));
  });

  it('emits sortChange from header clicks and leaves row order untouched', () => {
    cy.get('th').contains('Invoice').click();
    cy.get('[data-cy="last-sort"]').should('contain.text', 'id asc');
    cy.get('tr.m3k-data-table__row').first().should('contain.text', 'INV-0001');
    cy.then(() => expect(host.dataSource.fetches).to.eq(0));
  });

  it('emits pageChange from the paginator instead of paging internally', () => {
    cy.get('.mat-mdc-paginator-navigation-next').click();
    cy.get('[data-cy="last-page"]').should('contain.text', '1 5');
    cy.get('tr.m3k-data-table__row').should('have.length', 3);
    cy.then(() => expect(host.dataSource.fetches).to.eq(0));
  });
});
