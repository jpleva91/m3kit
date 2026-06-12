import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, withDisabledInitialNavigation } from '@angular/router';
import {
  createExportResult,
  encodeDataQueryParam,
  InMemoryTableDataSource,
  resolveColumns,
  serializeDataQuery,
  type DataQuery,
  type ExportResult,
  type ReportTelemetryEvent,
  type ReportTelemetryReporter,
} from '@m3kit/core';
import { REPORT_TELEMETRY_REPORTER } from '@m3kit/state';
import { INVOICES_TABLE_DEFINITION, makeInvoices } from '@m3kit/testing';

import { ExportDownloadService } from './export-download';
import { REPORT_QUERY_PARAM } from './report-url-state';
import { ReportsComponent } from './reports.component';

class TestTelemetryReporter implements ReportTelemetryReporter {
  readonly events: ReportTelemetryEvent[] = [];

  report(event: ReportTelemetryEvent): void {
    this.events.push(event);
  }
}

class TestExportDownloadService {
  readonly downloads: ExportResult[] = [];

  download(result: ExportResult): void {
    this.downloads.push(result);
  }
}

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let element: HTMLElement;
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let router: Router;
  let telemetry: TestTelemetryReporter;
  let downloads: TestExportDownloadService;

  beforeEach(async () => {
    telemetry = new TestTelemetryReporter();
    downloads = new TestExportDownloadService();

    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        provideRouter([], withDisabledInitialNavigation()),
        { provide: REPORT_TELEMETRY_REPORTER, useValue: telemetry },
        { provide: ExportDownloadService, useValue: downloads },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fetchSpy = vi.spyOn(InMemoryTableDataSource.prototype, 'fetch');
    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  function clickButtonByText(text: RegExp): void {
    const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
      text.test(candidate.textContent ?? ''),
    ) as HTMLButtonElement | undefined;
    expect(button).toBeTruthy();
    button?.click();
    fixture.detectChanges();
  }

  function currentQueryParam(): string | null {
    return router.parseUrl(router.url).queryParams[REPORT_QUERY_PARAM] ?? null;
  }

  it('renders the invoices report toolbar with the total row count', () => {
    const toolbar = element.querySelector('m3k-page-toolbar');
    expect(toolbar?.textContent).toContain('Invoices');
    expect(toolbar?.textContent).toContain('120');
  });

  it('renders the filter bar and a populated invoice table', () => {
    expect(element.querySelector('m3k-table-filter-bar')).toBeTruthy();
    const rows = element.querySelectorAll('m3k-data-table tbody tr');
    // Default page size of the invoices definition is 10.
    expect(rows.length).toBe(10);
    expect(element.textContent).toContain('INV-2026-');
  });

  it('fetches exactly once on init, through the store only', () => {
    // The table is controlled ([rows] bound), so the store's connect()
    // is the single fetch path — no second pipeline inside the table.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('routes table sort events through the store as the only fetch path', () => {
    const customerSort = element.querySelector(
      'th.cdk-column-customerName .mat-sort-header-container',
    ) as HTMLElement;
    customerSort.click();
    fixture.detectChanges();

    // Exactly one more fetch (store.setSort), none from the table itself.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const query = fetchSpy.mock.calls[1][0] as { sort: unknown };
    expect(query.sort).toEqual({ key: 'customerName', direction: 'asc' });
    expect(element.querySelector('th.cdk-column-customerName')?.getAttribute('aria-sort')).toBe(
      'ascending',
    );
  });

  it('routes paginator events through the store as the only fetch path', () => {
    const next = element.querySelector(
      'button.mat-mdc-paginator-navigation-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const query = fetchSpy.mock.calls[1][0] as { page: unknown };
    expect(query.page).toEqual({ index: 1, size: 10 });
    const numbers = Array.from(
      element.querySelectorAll('m3k-data-table td.cdk-column-number'),
    ).map((cell) => cell.textContent?.trim());
    expect(numbers.length).toBe(10);
  });

  it('renders the field-filter form inside an expansion panel', () => {
    const panel = element.querySelector('mat-expansion-panel');
    expect(panel?.textContent).toContain('Field filters');
    expect(panel?.querySelector('m3k-filter-form')).toBeTruthy();
  });

  it('feeds filter form values into the table as field filters', fakeAsync(() => {
    // Same fixtures the component builds its data source from.
    const invoices = makeInvoices(120, 1);
    const target = invoices[0].customerName;
    const expectedRows = Math.min(
      invoices.filter((invoice) => invoice.customerName === target).length,
      10,
    );

    const form = element.querySelector('m3k-filter-form') as HTMLElement;
    const customerField = Array.from(form.querySelectorAll('m3k-form-field')).find(
      (field) => field.textContent?.includes('Customer'),
    ) as HTMLElement;
    const input = customerField.querySelector('input') as HTMLInputElement;

    input.value = target;
    input.dispatchEvent(new Event('input'));
    tick(250);
    fixture.detectChanges();

    const customerCells = Array.from(
      element.querySelectorAll('m3k-data-table td.cdk-column-customerName'),
    ).map((cell) => cell.textContent?.trim());
    expect(customerCells.length).toBe(expectedRows);
    expect(customerCells.every((cell) => cell === target)).toBe(true);
  }));

  it('restores the report query from the URL and syncs subsequent query changes back', fakeAsync(() => {
    fixture.destroy();
    const restored: DataQuery = {
      filter: { text: 'acme', fields: { status: 'paid' } },
      sort: { key: 'amount', direction: 'desc' },
      page: { index: 1, size: 10 },
    };
    fetchSpy.mockClear();

    router.navigateByUrl(`/?${REPORT_QUERY_PARAM}=${encodeURIComponent(encodeDataQueryParam(restored))}`);
    tick();
    createComponent();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toEqual(restored);

    const customerSort = element.querySelector(
      'th.cdk-column-customerName .mat-sort-header-container',
    ) as HTMLElement;
    customerSort.click();
    fixture.detectChanges();
    tick();

    const synced = currentQueryParam();
    expect(synced).not.toBeNull();
    expect(synced).toContain('customerName');
    expect(synced).toContain('acme');
  }));

  it('applies a saved view to rows, columns, telemetry, and URL together', fakeAsync(() => {
    clickButtonByText(/Saved views/i);
    clickButtonByText(/Overdue invoices/i);
    tick();
    fixture.detectChanges();

    const lastQuery = fetchSpy.mock.calls.at(-1)?.[0] as DataQuery;
    expect(lastQuery.filter.fields).toEqual({ status: 'overdue' });
    expect(lastQuery.sort).toEqual({ key: 'dueAt', direction: 'asc' });
    expect(currentQueryParam()).toBe(encodeDataQueryParam(lastQuery));
    expect(element.querySelectorAll('m3k-data-table td.cdk-column-status').length).toBeGreaterThan(0);
    expect(
      Array.from(element.querySelectorAll('m3k-data-table td.cdk-column-status')).every((cell) =>
        cell.textContent?.includes('overdue'),
      ),
    ).toBe(true);
    expect(element.querySelector('th.cdk-column-amount')?.className).toContain('m3k-data-table__cell--pinned-end');
    expect(telemetry.events.some((event) => event.type === 'report.saved_view_applied')).toBe(true);
  }));

  it('exports CSV and JSON for current page and all filtered rows without network', fakeAsync(() => {
    clickButtonByText(/Saved views/i);
    clickButtonByText(/Overdue invoices/i);
    tick();
    fixture.detectChanges();
    const query = fetchSpy.mock.calls.at(-1)?.[0] as DataQuery;
    const exportColumns = resolveColumns(INVOICES_TABLE_DEFINITION.columns, [
      { key: 'amount', pinned: 'end' },
    ]).map(({ def }) => ({
      key: def.key,
      header: def.header,
      type: def.type,
    }));
    const invoices = makeInvoices(120, 1);
    const expectedRows = invoices.filter((invoice) => invoice.status === 'overdue');
    const expectedPageRows = [...expectedRows].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 10);
    const expectedPage = createExportResult(
      {
        reportId: INVOICES_TABLE_DEFINITION.id,
        format: 'csv',
        scope: 'page',
        fileBaseName: 'invoices',
        query: serializeDataQuery(query),
        columns: exportColumns,
        requestedAt: '2026-06-12T00:00:00.000Z',
      },
      expectedPageRows,
      { locale: 'en-US', timeZone: 'UTC', currencyCode: 'USD' },
    );

    clickButtonByText(/Export/i);
    clickButtonByText(/CSV · current page/i);
    tick();
    fixture.detectChanges();
    const pageDownload = downloads.downloads.at(-1);
    expect(pageDownload?.kind).toBe('success');
    expect(pageDownload?.request.scope).toBe('page');
    expect(pageDownload?.request.format).toBe('csv');
    expect(pageDownload).toBeDefined();
    expect(pageDownload?.kind).toBe('success');
    if (pageDownload?.kind !== 'success') {
      throw new Error('expected CSV export success');
    }
    expect(pageDownload.content).toBe(
      expectedPage.kind === 'success' ? expectedPage.content : '',
    );

    clickButtonByText(/Export/i);
    clickButtonByText(/JSON · all filtered rows/i);
    tick();
    fixture.detectChanges();
    const allDownload = downloads.downloads.at(-1);
    expect(allDownload?.kind).toBe('success');
    expect(allDownload?.request.scope).toBe('all');
    expect(allDownload?.request.format).toBe('json');
    if (allDownload?.kind !== 'success') {
      throw new Error('expected JSON export success');
    }
    const successfulAllDownload = allDownload as Extract<ExportResult, { kind: 'success' }>;
    expect(JSON.parse(successfulAllDownload.content).length).toBe(expectedRows.length);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(telemetry.events.some((event) => event.type === 'report.export_completed')).toBe(true);
  }));

  it('marks settled data as stale and refreshes from the banner', () => {
    clickButtonByText(/Mark stale/i);
    fixture.detectChanges();

    expect(element.querySelector('m3k-banner')?.textContent).toContain('stale');
    clickButtonByText(/Refresh/i);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(element.querySelector('m3k-banner')).toBeFalsy();
  });
});
