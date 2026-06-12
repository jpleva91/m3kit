import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import {
  createExportResult,
  InMemoryTableDataSource,
  resolveColumns,
  serializeDataQuery,
  TableDefinition,
  type ColumnViewState,
  type DataQuery,
  type ExportColumn,
  type ExportFormat,
  type ExportResult,
  type ExportScope,
  type ReportTelemetryEvent,
} from '@m3kit/core';
import { REPORT_TELEMETRY_REPORTER, withDataQuery, withSelection } from '@m3kit/state';
import { BannerComponent } from '@m3kit/feedback';
import { FilterFormComponent, FilterFormValues, FormFieldOption } from '@m3kit/forms';
import {
  TableFilterBarChange,
  TableFilterBarComponent,
  DataTableComponent,
  PageToolbarComponent,
} from '@m3kit/table';
import { INVOICES_TABLE_DEFINITION, Invoice, makeInvoices } from '@m3kit/testing';

import { ExportDownloadService } from './export-download';
import { readReportUrlState, syncReportUrlQuery } from './report-url-state';
import { SavedViewsService } from './saved-views.service';

/** Seed for the synthetic invoice fixtures, so the demo is deterministic. */
const INVOICE_SEED = 1;
const REPORT_ID = INVOICES_TABLE_DEFINITION.id;

const INVOICES = makeInvoices(120, INVOICE_SEED);

const DEFAULT_INVOICES_QUERY: DataQuery = {
  filter: {},
  sort: INVOICES_TABLE_DEFINITION.defaultSort
    ? {
        key: String(INVOICES_TABLE_DEFINITION.defaultSort.key),
        direction: INVOICES_TABLE_DEFINITION.defaultSort.direction,
      }
    : null,
  page: { index: 0, size: INVOICES_TABLE_DEFINITION.defaultPageSize ?? 10 },
};

/**
 * Page-local SignalStore composed from `@m3kit/state` features.
 */
const InvoicesReportStore = signalStore(
  withDataQuery<Invoice>({ debounceMs: 0, initialPageSize: 10, reportId: REPORT_ID }),
  withSelection<Invoice>((invoice) => invoice.id),
  withMethods((store) => ({
    applyQuery(query: DataQuery): void {
      patchState(store, { query });
    },
  })),
);

@Component({
  selector: 'app-reports',
  imports: [
    BannerComponent,
    FilterFormComponent,
    MatButtonModule,
    MatExpansionModule,
    MatMenuModule,
    TableFilterBarComponent,
    DataTableComponent,
    PageToolbarComponent,
  ],
  providers: [InvoicesReportStore, SavedViewsService],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  protected readonly definition: TableDefinition<Invoice> = INVOICES_TABLE_DEFINITION;

  protected readonly dataSource = new InMemoryTableDataSource<Invoice>(INVOICES);

  /** Single source of truth: fetches pages and drives the table and toolbar. */
  protected readonly store = inject(InvoicesReportStore);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly downloads = inject(ExportDownloadService);
  private readonly telemetry = inject(REPORT_TELEMETRY_REPORTER);
  private readonly savedViewsService = inject(SavedViewsService);

  protected readonly savedViews = this.savedViewsService.views;
  protected readonly columnState = signal<readonly ColumnViewState[] | undefined>(undefined);

  protected readonly visibleExportColumns = computed<readonly ExportColumn[]>(() =>
    resolveColumns(this.definition.columns, this.columnState()).map(({ def }) => ({
      key: def.key,
      header: def.header,
      type: def.type,
    })),
  );

  /** Distinct badge values per column, as select options for the filter form. */
  protected readonly filterOptions: Readonly<Record<string, readonly FormFieldOption[]>> = {
    status: [...new Set(INVOICES.map((invoice) => invoice.status))]
      .sort()
      .map((status) => ({ value: status, label: status })),
  };

  /** Last invoice the user clicked (selection is tracked by id in the store). */
  protected readonly selectedInvoice = computed(
    () => INVOICES.find((invoice) => this.store.isSelected()(invoice)) ?? null,
  );

  constructor() {
    const initial = readReportUrlState(this.currentUrlRoute(), DEFAULT_INVOICES_QUERY);
    this.applyQuery(initial.query, false);
    this.columnState.set(initial.columnState);
    this.store.connect(this.dataSource);

    effect(() => {
      void syncReportUrlQuery(this.router, this.route, this.store.query());
    });
  }

  protected onFilterChange(change: TableFilterBarChange): void {
    this.store.setTextFilter(change.text);
  }

  protected onFiltersChange(filters: FilterFormValues): void {
    this.store.setFieldFilters(toFieldFilters(filters));
  }

  protected onRowClicked(invoice: Invoice): void {
    this.store.clear();
    this.store.select(invoice);
  }

  protected applySavedView(viewId: string): void {
    const applied = this.savedViewsService.apply(viewId);
    if (applied === null) {
      return;
    }
    this.columnState.set(applied.columns);
    this.applyQuery(applied.query);
    this.store.refresh();
  }

  protected markStale(): void {
    this.store.markStale();
  }

  protected refresh(): void {
    this.store.refresh();
  }

  protected exportReport(format: ExportFormat, scope: Extract<ExportScope, 'page' | 'all'>): void {
    const query = this.store.query();
    this.reportTelemetry({ type: 'report.export_requested', format, scope });
    const request = {
      reportId: REPORT_ID,
      format,
      scope,
      fileBaseName: 'invoices',
      query: serializeDataQuery(query),
      columns: this.visibleExportColumns(),
      requestedAt: new Date().toISOString(),
    };
    const rows = scope === 'page' ? this.store.rows() : rowsForQuery(INVOICES, query, false);
    const result = createExportResult(request, rows, {
      locale: 'en-US',
      timeZone: 'UTC',
      currencyCode: 'USD',
    });
    this.downloads.download(result);
    this.reportExportResult(result);
  }

  private applyQuery(query: DataQuery, sync = true): void {
    this.store.applyQuery(query);
    if (sync) {
      void syncReportUrlQuery(this.router, this.route, query);
    }
  }

  private currentUrlRoute() {
    const parsed = this.router.parseUrl(this.router.url);
    return {
      snapshot: {
        queryParamMap: {
          get: (name: string) => parsed.queryParams[name] ?? this.route.snapshot.queryParamMap.get(name),
        },
      },
    };
  }

  private reportExportResult(result: ExportResult): void {
    if (result.kind === 'success') {
      this.reportTelemetry({
        type: 'report.export_completed',
        format: result.request.format,
        scope: result.request.scope,
        rowCount: result.rowCount,
      });
      return;
    }
    this.reportTelemetry({
      type: 'report.export_failed',
      format: result.request.format,
      scope: result.request.scope,
      errorKind: result.error.kind,
    });
  }

  private reportTelemetry(event: Record<string, unknown>): void {
    try {
      this.telemetry.report({
        ...event,
        reportId: REPORT_ID,
        at: new Date().toISOString(),
      } as ReportTelemetryEvent);
    } catch {
      // App-level telemetry adapters must never break report workflows.
    }
  }
}

/**
 * Adapts filter-form values to the invoice rows: datepicker `Date`
 * values become the UTC-midnight ISO strings the fixtures carry, so
 * exact-match field filtering lines up.
 */
function toFieldFilters(filters: FilterFormValues): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      value instanceof Date
        ? new Date(
            Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
          ).toISOString()
        : value,
    ]),
  );
}

function rowsForQuery(
  rows: readonly Invoice[],
  query: DataQuery,
  paginate: boolean,
): readonly Invoice[] {
  const text = query.filter.text?.trim().toLowerCase();
  const fields = Object.entries(query.filter.fields ?? {}).filter(([, value]) => value !== undefined);
  let out = rows.filter((row) => {
    const record = row as unknown as Record<string, unknown>;
    const textMatches = !text || Object.values(record).some(
      (value) => typeof value === 'string' && value.toLowerCase().includes(text),
    );
    const fieldsMatch = fields.every(([key, expected]) => record[key] === expected);
    return textMatches && fieldsMatch;
  });

  if (query.sort !== null) {
    const direction = query.sort.direction === 'desc' ? -1 : 1;
    const key = query.sort.key;
    out = [...out].sort((a, b) => compareValues((a as unknown as Record<string, unknown>)[key], (b as unknown as Record<string, unknown>)[key]) * direction);
  }

  if (!paginate) {
    return out;
  }
  const start = query.page.index * query.page.size;
  return out.slice(start, start + query.page.size);
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
