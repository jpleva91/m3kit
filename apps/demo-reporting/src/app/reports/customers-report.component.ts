import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { InMemoryTableDataSource, TableDefinition } from '@m3kit/core';
import {
  TableFilterBarChange,
  TableFilterBarComponent,
  DataTableComponent,
  PageToolbarComponent,
} from '@m3kit/table';
import { CUSTOMERS_TABLE_DEFINITION, Customer, makeCustomers } from '@m3kit/testing';

/** Seed for the synthetic customer fixtures, so the demo is deterministic. */
const CUSTOMER_SEED = 1;

/**
 * Customers report demo: reuses the exact same building blocks as the
 * invoices report (`m3k-page-toolbar`, `m3k-table-filter-bar`,
 * `m3k-data-table`) with a different definition and data source,
 * demonstrating reusability of the reporting components.
 */
@Component({
  selector: 'app-customers-report',
  imports: [TableFilterBarComponent, DataTableComponent, PageToolbarComponent],
  templateUrl: './customers-report.component.html',
  styleUrl: './customers-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersReportComponent {
  protected readonly definition: TableDefinition<Customer> = CUSTOMERS_TABLE_DEFINITION;

  protected readonly dataSource = new InMemoryTableDataSource<Customer>(
    makeCustomers(120, CUSTOMER_SEED),
  );

  /** Debounced text from the filter bar, fed into the table. */
  protected readonly filterText = signal('');

  /** Last customer the user clicked, surfaced under the table. */
  protected readonly selectedCustomer = signal<Customer | null>(null);

  protected onFilterChange(change: TableFilterBarChange): void {
    this.filterText.set(change.text);
  }

  protected onRowClicked(customer: Customer): void {
    this.selectedCustomer.set(customer);
  }
}
