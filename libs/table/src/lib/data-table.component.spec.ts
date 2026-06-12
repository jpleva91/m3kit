import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, throwError } from 'rxjs';
import {
  InMemoryTableDataSource,
  TableDataSource,
  TableDefinition,
  DataPage,
  DataQuery,
  ColumnViewState,
  PageState,
  SortState,
} from '@m3kit/core';

import { DataTableComponent } from './data-table.component';

interface InvoiceRow {
  readonly id: string;
  readonly customerName: string;
  readonly amount: number;
  readonly status: 'draft' | 'sent' | 'paid' | 'overdue';
  readonly issuedAt: Date;
}

const STATUSES: readonly InvoiceRow['status'][] = ['draft', 'sent', 'paid', 'overdue'];

function makeInvoices(count: number): InvoiceRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `INV-${String(i + 1).padStart(4, '0')}`,
    customerName: `Acme Corp ${i + 1}`,
    amount: (i + 1) * 110.5,
    status: STATUSES[i % STATUSES.length],
    issuedAt: new Date(2026, 0, i + 1),
  }));
}

const INVOICE_DEFINITION: TableDefinition<InvoiceRow> = {
  id: 'invoices',
  title: 'Invoices',
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
      format: { badgeColors: { paid: 'success', overdue: 'warn', sent: 'primary' } },
    },
    {
      key: 'issuedAt',
      header: 'Issued',
      type: 'date',
      sortable: true,
      format: { dateFormat: 'yyyy-MM-dd' },
    },
  ],
  defaultPageSize: 5,
};

/** Wraps a data source and records every query it receives. */
class RecordingDataSource implements TableDataSource<InvoiceRow> {
  readonly queries: DataQuery[] = [];

  constructor(private readonly inner: TableDataSource<InvoiceRow>) {}

  fetch(query: DataQuery): Observable<DataPage<InvoiceRow>> {
    this.queries.push(query);
    return this.inner.fetch(query);
  }

  get lastQuery(): DataQuery {
    const last = this.queries.at(-1);
    if (!last) {
      throw new Error('no query recorded');
    }
    return last;
  }
}

@Component({
  imports: [DataTableComponent],
  template: `
    <m3k-data-table
      [definition]="definition"
      [dataSource]="dataSource"
      [textFilter]="text"
      [fieldFilters]="fields"
      [columnState]="columnState"
      (rowClicked)="clicked = $event"
    />
  `,
})
class HostComponent {
  definition = INVOICE_DEFINITION;
  dataSource: TableDataSource<InvoiceRow> = new RecordingDataSource(
    new InMemoryTableDataSource(makeInvoices(12)),
  );
  text = '';
  fields: Readonly<Record<string, unknown>> = {};
  columnState: readonly ColumnViewState[] | undefined = undefined;
  clicked: InvoiceRow | null = null;
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let recording: RecordingDataSource;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const headerTexts = (): string[] =>
    Array.from(element().querySelectorAll('th[mat-header-cell]')).map((th) =>
      (th.textContent ?? '').trim(),
    );
  const cellTexts = (selector: string): string[] =>
    Array.from(element().querySelectorAll(selector)).map((td) =>
      (td.textContent ?? '').trim(),
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    recording = host.dataSource as RecordingDataSource;
    fixture.detectChanges();
  });

  it('renders one header per definition column', () => {
    expect(headerTexts()).toEqual(['Invoice', 'Customer', 'Amount', 'Status', 'Issued']);
  });

  it('hides columns with visible false and reorders visible state entries', () => {
    host.columnState = [
      { key: 'amount' },
      { key: 'id' },
      { key: 'customerName', visible: false },
      { key: 'status' },
    ];
    fixture.detectChanges();

    expect(headerTexts()).toEqual(['Amount', 'Invoice', 'Status', 'Issued']);
    expect(element().querySelector('th.cdk-column-customerName')).toBeNull();
    expect(element().querySelector('td.cdk-column-customerName')).toBeNull();
  });

  it('pins start and end columns from columnState', () => {
    host.columnState = [
      { key: 'amount', pinned: 'end' },
      { key: 'id', pinned: 'start' },
    ];
    fixture.detectChanges();

    expect(element().querySelector('th.cdk-column-id')?.classList).toContain('mat-mdc-table-sticky');
    expect(element().querySelector('td.cdk-column-id')?.classList).toContain('mat-mdc-table-sticky');
    expect(element().querySelector('th.cdk-column-amount')?.classList).toContain('mat-mdc-table-sticky');
    expect(element().querySelector('td.cdk-column-amount')?.classList).toContain('mat-mdc-table-sticky');
  });

  it('uses columnState width over definition width', () => {
    host.definition = {
      ...INVOICE_DEFINITION,
      columns: INVOICE_DEFINITION.columns.map((column) =>
        column.key === 'id' ? { ...column, width: '120px' } : column,
      ),
    };
    host.columnState = [{ key: 'id', width: '18rem' }];
    fixture.detectChanges();

    expect((element().querySelector('th.cdk-column-id') as HTMLElement).style.width).toBe('18rem');
  });

  it('drops duplicate and unknown columnState entries with first match winning', () => {
    host.columnState = [
      { key: 'unknown' },
      { key: 'amount' },
      { key: 'amount', visible: false },
      { key: 'id' },
    ];
    fixture.detectChanges();

    expect(headerTexts()).toEqual(['Amount', 'Invoice', 'Customer', 'Status', 'Issued']);
  });

  it('re-resolves columnState when the definition changes', () => {
    host.columnState = [{ key: 'issuedAt' }, { key: 'id' }, { key: 'amount', visible: false }];
    host.definition = {
      ...INVOICE_DEFINITION,
      columns: INVOICE_DEFINITION.columns.filter((column) => column.key !== 'issuedAt'),
    };
    fixture.detectChanges();

    expect(headerTexts()).toEqual(['Invoice', 'Customer', 'Status']);
    expect(element().querySelector('th.cdk-column-issuedAt')).toBeNull();
    expect(element().querySelector('th.cdk-column-amount')).toBeNull();
  });

  it('renders the first page of rows at the default page size', () => {
    expect(element().querySelectorAll('tr[mat-row]').length).toBe(5);
    expect(cellTexts('td.cdk-column-id')).toEqual([
      'INV-0001',
      'INV-0002',
      'INV-0003',
      'INV-0004',
      'INV-0005',
    ]);
  });

  it('formats currency, date, and badge cells per column type', () => {
    const firstRow = element().querySelector('tr[mat-row]') as HTMLElement;
    expect(firstRow.querySelector('td.cdk-column-amount')?.textContent?.trim()).toBe('$110.50');
    expect(firstRow.querySelector('td.cdk-column-issuedAt')?.textContent?.trim()).toBe(
      '2026-01-01',
    );
    const badge = firstRow.querySelector('td.cdk-column-status .m3k-badge');
    expect(badge?.textContent?.trim()).toBe('draft');
    expect(badge?.getAttribute('data-color')).toBe('default');

    const paidBadge = element().querySelectorAll('td.cdk-column-status .m3k-badge')[2];
    expect(paidBadge.getAttribute('data-color')).toBe('success');
  });

  it('updates the query and row order when a sortable header is clicked', () => {
    const amountSort = element().querySelector(
      'th.cdk-column-amount .mat-sort-header-container',
    ) as HTMLElement;
    amountSort.click();
    fixture.detectChanges();

    expect(recording.lastQuery.sort).toEqual({ key: 'amount', direction: 'asc' });

    amountSort.click();
    fixture.detectChanges();

    expect(recording.lastQuery.sort).toEqual({ key: 'amount', direction: 'desc' });
    expect(cellTexts('td.cdk-column-id')[0]).toBe('INV-0012');
    expect(recording.lastQuery.page.index).toBe(0);
  });

  it('updates the query and rows when the paginator advances', () => {
    const next = element().querySelector(
      'button.mat-mdc-paginator-navigation-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(recording.lastQuery.page).toEqual({ index: 1, size: 5 });
    expect(cellTexts('td.cdk-column-id')).toEqual([
      'INV-0006',
      'INV-0007',
      'INV-0008',
      'INV-0009',
      'INV-0010',
    ]);
  });

  it('applies the textFilter input and resets to the first page', () => {
    const next = element().querySelector(
      'button.mat-mdc-paginator-navigation-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    host.text = 'Acme Corp 3';
    fixture.detectChanges();

    expect(recording.lastQuery.filter.text).toBe('Acme Corp 3');
    expect(recording.lastQuery.page.index).toBe(0);
    expect(cellTexts('td.cdk-column-customerName')).toEqual(['Acme Corp 3']);
  });

  it('applies the fieldFilters input and resets to the first page', () => {
    const next = element().querySelector(
      'button.mat-mdc-paginator-navigation-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    host.fields = { status: 'paid' };
    fixture.detectChanges();

    expect(recording.lastQuery.filter.fields).toEqual({ status: 'paid' });
    expect(recording.lastQuery.page.index).toBe(0);
    expect(cellTexts('td.cdk-column-id')).toEqual(['INV-0003', 'INV-0007', 'INV-0011']);
  });

  it('omits empty fieldFilters from the query', () => {
    expect(recording.lastQuery.filter.fields).toBeUndefined();
  });

  it('applies field filters imperatively via applyFieldFilters()', () => {
    const table = fixture.debugElement.children[0]
      .componentInstance as DataTableComponent<InvoiceRow>;
    table.applyFieldFilters({ customerName: 'Acme Corp 9' });
    fixture.detectChanges();

    expect(recording.lastQuery.filter.fields).toEqual({ customerName: 'Acme Corp 9' });
    expect(cellTexts('td.cdk-column-id')).toEqual(['INV-0009']);
  });

  it('applies text imperatively via applyTextFilter()', () => {
    const table = fixture.debugElement.children[0]
      .componentInstance as DataTableComponent<InvoiceRow>;
    table.applyTextFilter('INV-0009');
    fixture.detectChanges();

    expect(recording.lastQuery.filter.text).toBe('INV-0009');
    expect(cellTexts('td.cdk-column-id')).toEqual(['INV-0009']);
  });

  it('emits rowClicked with the clicked row', () => {
    (element().querySelector('tr[mat-row]') as HTMLElement).click();
    expect(host.clicked?.id).toBe('INV-0001');
  });

  it('shows the empty state row when no rows match', () => {
    host.text = 'no-such-customer';
    fixture.detectChanges();

    expect(element().querySelectorAll('tr[mat-row]').length).toBe(0);
    expect(element().querySelector('.m3k-data-table__empty-cell')?.textContent).toContain(
      'No matching records.',
    );
    expect(element().querySelector('.m3k-data-table__error-cell')).toBeNull();
  });

  describe('erroring data source', () => {
    class FailingDataSource implements TableDataSource<InvoiceRow> {
      fetch(): Observable<DataPage<InvoiceRow>> {
        return throwError(() => new Error('synthetic datasource failure'));
      }
    }

    const table = (): DataTableComponent<InvoiceRow> =>
      fixture.debugElement.children[0].componentInstance as DataTableComponent<InvoiceRow>;

    beforeEach(() => {
      host.dataSource = new FailingDataSource();
      fixture.detectChanges();
    });

    it('renders the error state row, distinct from the empty state', () => {
      expect(element().querySelectorAll('tr[mat-row]').length).toBe(0);
      expect(element().querySelector('.m3k-data-table__error-cell')?.textContent).toContain(
        'Failed to load data.',
      );
      expect(element().querySelector('.m3k-data-table__empty-cell')).toBeNull();
    });

    it('sets the error signal and clears loading', () => {
      expect(table().hasError()).toBe(true);
      expect(table().isLoading()).toBe(false);
      expect(element().querySelector('mat-progress-bar')).toBeNull();
    });

    it('recovers when a working data source is supplied', () => {
      host.dataSource = new InMemoryTableDataSource(makeInvoices(3));
      fixture.detectChanges();

      expect(table().hasError()).toBe(false);
      expect(element().querySelector('.m3k-data-table__error-cell')).toBeNull();
      expect(element().querySelectorAll('tr[mat-row]').length).toBe(3);
    });
  });
});

@Component({
  imports: [DataTableComponent],
  template: `
    <m3k-data-table
      [definition]="definition"
      [dataSource]="dataSource"
      [rows]="rows"
      [loading]="loading"
      [error]="error"
      [totalCount]="totalCount"
      [sort]="sort"
      [page]="page"
      [columnState]="columnState"
      (sortChange)="sortChanges.push($event)"
      (pageChange)="pageChanges.push($event)"
    />
  `,
})
class ControlledHostComponent {
  definition = INVOICE_DEFINITION;
  dataSource: TableDataSource<InvoiceRow> = new RecordingDataSource(
    new InMemoryTableDataSource(makeInvoices(12)),
  );
  rows: readonly InvoiceRow[] = makeInvoices(3);
  loading = false;
  error: string | null = null;
  totalCount = 42;
  sort: SortState | null = { key: 'amount', direction: 'asc' };
  page: PageState = { index: 0, size: 5 };
  columnState: readonly ColumnViewState[] | undefined = undefined;
  readonly sortChanges: (SortState | null)[] = [];
  readonly pageChanges: PageState[] = [];
}

describe('DataTableComponent (controlled mode)', () => {
  let fixture: ComponentFixture<ControlledHostComponent>;
  let host: ControlledHostComponent;
  let recording: RecordingDataSource;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlledHostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlledHostComponent);
    host = fixture.componentInstance;
    recording = host.dataSource as RecordingDataSource;
    fixture.detectChanges();
  });

  it('renders the provided rows without fetching from the data source', () => {
    expect(element().querySelectorAll('tr[mat-row]').length).toBe(3);
    expect(element().textContent).toContain('INV-0001');
    expect(recording.queries.length).toBe(0);
  });

  it('drives the paginator from the totalCount and page inputs', () => {
    const range = element().querySelector('.mat-mdc-paginator-range-label');
    expect(range?.textContent).toContain('of 42');
  });

  it('emits sortChange from header clicks instead of sorting internally', () => {
    host.columnState = [{ key: 'amount', pinned: 'end' }, { key: 'id', visible: false }];
    fixture.detectChanges();

    const amountSort = element().querySelector(
      'th.cdk-column-amount .mat-sort-header-container',
    ) as HTMLElement;
    // The header is already sorted asc via the `sort` input, so the
    // next click requests desc.
    amountSort.click();
    fixture.detectChanges();

    expect(host.sortChanges).toEqual([{ key: 'amount', direction: 'desc' }]);
    expect(recording.queries.length).toBe(0);
    // Row order is untouched: ordering is the owner's job.
    expect(element().querySelector('tr[mat-row]')?.textContent).toContain('Acme Corp 1');
  });

  it('emits pageChange from the paginator instead of paging internally', () => {
    host.columnState = [{ key: 'amount', pinned: 'end' }, { key: 'id', visible: false }];
    fixture.detectChanges();

    const next = element().querySelector(
      'button.mat-mdc-paginator-navigation-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(host.pageChanges).toEqual([{ index: 1, size: 5 }]);
    expect(recording.queries.length).toBe(0);
  });

  it('honors the loading input', () => {
    expect(element().querySelector('mat-progress-bar')).toBeNull();

    host.loading = true;
    fixture.detectChanges();

    expect(element().querySelector('mat-progress-bar')).toBeTruthy();
  });

  it('renders the error input message in the error state row', () => {
    host.rows = [];
    host.error = 'synthetic store failure';
    fixture.detectChanges();

    expect(element().querySelector('.m3k-data-table__error-cell')?.textContent).toContain(
      'synthetic store failure',
    );
    expect(element().querySelector('.m3k-data-table__empty-cell')).toBeNull();
  });

  it('shows the empty state when the provided rows are empty and error is null', () => {
    host.rows = [];
    fixture.detectChanges();

    expect(element().querySelector('.m3k-data-table__empty-cell')?.textContent).toContain(
      'No matching records.',
    );
  });
});
