import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, throwError } from 'rxjs';
import {
  InMemoryReportDataSource,
  ReportDataSource,
  ReportDefinition,
  ReportPage,
  ReportQuery,
} from '@m3kit/core';

import { ReportTableComponent } from './report-table.component';

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

const INVOICE_DEFINITION: ReportDefinition<InvoiceRow> = {
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
class RecordingDataSource implements ReportDataSource<InvoiceRow> {
  readonly queries: ReportQuery[] = [];

  constructor(private readonly inner: ReportDataSource<InvoiceRow>) {}

  fetch(query: ReportQuery): Observable<ReportPage<InvoiceRow>> {
    this.queries.push(query);
    return this.inner.fetch(query);
  }

  get lastQuery(): ReportQuery {
    const last = this.queries.at(-1);
    if (!last) {
      throw new Error('no query recorded');
    }
    return last;
  }
}

@Component({
  imports: [ReportTableComponent],
  template: `
    <rpt-report-table
      [definition]="definition"
      [dataSource]="dataSource"
      [textFilter]="text"
      [fieldFilters]="fields"
      (rowClicked)="clicked = $event"
    />
  `,
})
class HostComponent {
  definition = INVOICE_DEFINITION;
  dataSource: ReportDataSource<InvoiceRow> = new RecordingDataSource(
    new InMemoryReportDataSource(makeInvoices(12)),
  );
  text = '';
  fields: Readonly<Record<string, unknown>> = {};
  clicked: InvoiceRow | null = null;
}

describe('ReportTableComponent', () => {
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
    const badge = firstRow.querySelector('td.cdk-column-status .rpt-badge');
    expect(badge?.textContent?.trim()).toBe('draft');
    expect(badge?.getAttribute('data-color')).toBe('default');

    const paidBadge = element().querySelectorAll('td.cdk-column-status .rpt-badge')[2];
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
      .componentInstance as ReportTableComponent<InvoiceRow>;
    table.applyFieldFilters({ customerName: 'Acme Corp 9' });
    fixture.detectChanges();

    expect(recording.lastQuery.filter.fields).toEqual({ customerName: 'Acme Corp 9' });
    expect(cellTexts('td.cdk-column-id')).toEqual(['INV-0009']);
  });

  it('applies text imperatively via applyTextFilter()', () => {
    const table = fixture.debugElement.children[0]
      .componentInstance as ReportTableComponent<InvoiceRow>;
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
    expect(element().querySelector('.rpt-report-table__empty-cell')?.textContent).toContain(
      'No matching records.',
    );
    expect(element().querySelector('.rpt-report-table__error-cell')).toBeNull();
  });

  describe('erroring data source', () => {
    class FailingDataSource implements ReportDataSource<InvoiceRow> {
      fetch(): Observable<ReportPage<InvoiceRow>> {
        return throwError(() => new Error('synthetic datasource failure'));
      }
    }

    const table = (): ReportTableComponent<InvoiceRow> =>
      fixture.debugElement.children[0].componentInstance as ReportTableComponent<InvoiceRow>;

    beforeEach(() => {
      host.dataSource = new FailingDataSource();
      fixture.detectChanges();
    });

    it('renders the error state row, distinct from the empty state', () => {
      expect(element().querySelectorAll('tr[mat-row]').length).toBe(0);
      expect(element().querySelector('.rpt-report-table__error-cell')?.textContent).toContain(
        'Failed to load data.',
      );
      expect(element().querySelector('.rpt-report-table__empty-cell')).toBeNull();
    });

    it('sets the error signal and clears loading', () => {
      expect(table().error()).toBe(true);
      expect(table().loading()).toBe(false);
      expect(element().querySelector('mat-progress-bar')).toBeNull();
    });

    it('recovers when a working data source is supplied', () => {
      host.dataSource = new InMemoryReportDataSource(makeInvoices(3));
      fixture.detectChanges();

      expect(table().error()).toBe(false);
      expect(element().querySelector('.rpt-report-table__error-cell')).toBeNull();
      expect(element().querySelectorAll('tr[mat-row]').length).toBe(3);
    });
  });
});
