import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { signalStore } from '@ngrx/signals';
import { InMemoryTableDataSource, TableDefinition } from '@m3kit/core';
import { withDataQuery, withSelection } from '@m3kit/state';
import { FilterFormComponent, FilterFormValues, FormFieldOption } from '@m3kit/forms';
import {
  TableFilterBarChange,
  TableFilterBarComponent,
  DataTableComponent,
  PageToolbarComponent,
} from '@m3kit/table';
import { INVOICES_TABLE_DEFINITION, Invoice, makeInvoices } from '@m3kit/testing';

/** Seed for the synthetic invoice fixtures, so the demo is deterministic. */
const INVOICE_SEED = 1;

const INVOICES = makeInvoices(120, INVOICE_SEED);

/**
 * Page-local SignalStore composed from `@m3kit/state` features:
 * `withDataQuery` owns the report query (text + field filters) plus the
 * filtered row count, and `withSelection` tracks the clicked invoice by
 * id. `debounceMs: 0` because `m3k-table-filter-bar` already debounces
 * its `filterChange` output.
 */
const InvoicesReportStore = signalStore(
  withDataQuery<Invoice>({ debounceMs: 0, initialPageSize: 10 }),
  withSelection<Invoice>((invoice) => invoice.id),
);

/**
 * Invoices report demo: composes `m3k-page-toolbar`,
 * `m3k-table-filter-bar`, `m3k-filter-form` (in an expansion panel),
 * and `m3k-data-table` over an in-memory data source of 120 synthetic
 * invoices. Query state lives in a `@m3kit/state` store
 * (`withDataQuery` + `withSelection`) that feeds the table's inputs and
 * consumes its outputs.
 */
@Component({
  selector: 'app-reports',
  imports: [
    FilterFormComponent,
    MatExpansionModule,
    TableFilterBarComponent,
    DataTableComponent,
    PageToolbarComponent,
  ],
  providers: [InvoicesReportStore],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  protected readonly definition: TableDefinition<Invoice> = INVOICES_TABLE_DEFINITION;

  protected readonly dataSource = new InMemoryTableDataSource<Invoice>(INVOICES);

  /** Drives the toolbar count and the table's filter inputs. */
  protected readonly store = inject(InvoicesReportStore);

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
    this.store.connect(this.dataSource);
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
