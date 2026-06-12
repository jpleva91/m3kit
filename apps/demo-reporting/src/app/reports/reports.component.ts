import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { InMemoryTableDataSource, TableDefinition } from '@m3kit/core';
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
 * Invoices report demo: composes `m3k-page-toolbar`,
 * `m3k-table-filter-bar`, `m3k-filter-form` (in an expansion panel),
 * and `m3k-data-table` over an in-memory data source of 120 synthetic
 * invoices.
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
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  protected readonly definition: TableDefinition<Invoice> = INVOICES_TABLE_DEFINITION;

  protected readonly dataSource = new InMemoryTableDataSource<Invoice>(INVOICES);

  /** Distinct badge values per column, as select options for the filter form. */
  protected readonly filterOptions: Readonly<Record<string, readonly FormFieldOption[]>> = {
    status: [...new Set(INVOICES.map((invoice) => invoice.status))]
      .sort()
      .map((status) => ({ value: status, label: status })),
  };

  /** Debounced text from the filter bar, fed into the table. */
  protected readonly filterText = signal('');

  /** Debounced field filters from the filter form, fed into the table. */
  protected readonly fieldFilters = signal<Readonly<Record<string, unknown>>>({});

  /** Last invoice the user clicked, surfaced under the table. */
  protected readonly selectedInvoice = signal<Invoice | null>(null);

  protected onFilterChange(change: TableFilterBarChange): void {
    this.filterText.set(change.text);
  }

  protected onFiltersChange(filters: FilterFormValues): void {
    this.fieldFilters.set(toFieldFilters(filters));
  }

  protected onRowClicked(invoice: Invoice): void {
    this.selectedInvoice.set(invoice);
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
