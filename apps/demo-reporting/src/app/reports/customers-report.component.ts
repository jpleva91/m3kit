import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { signalStore } from '@ngrx/signals';
import { InMemoryTableDataSource, TableDefinition } from '@m3kit/core';
import { withDataQuery, withSelection } from '@m3kit/state';
import {
  TableFilterBarChange,
  TableFilterBarComponent,
  DataTableComponent,
  PageToolbarComponent,
} from '@m3kit/table';
import { CUSTOMERS_TABLE_DEFINITION, Customer, makeCustomers } from '@m3kit/testing';

/** Seed for the synthetic customer fixtures, so the demo is deterministic. */
const CUSTOMER_SEED = 1;

const CUSTOMERS = makeCustomers(120, CUSTOMER_SEED);

/**
 * Page-local SignalStore composed from `@m3kit/state` features:
 * `withDataQuery` owns the text filter plus the filtered row count, and
 * `withSelection` tracks the clicked customer by id. `debounceMs: 0`
 * because `m3k-table-filter-bar` already debounces its output.
 */
const CustomersReportStore = signalStore(
  withDataQuery<Customer>({ debounceMs: 0, initialPageSize: 10 }),
  withSelection<Customer>((customer) => customer.id),
);

/**
 * Customers report demo: reuses the exact same building blocks as the
 * invoices report (`m3k-page-toolbar`, `m3k-table-filter-bar`,
 * `m3k-data-table`) with a different definition and data source,
 * demonstrating reusability of the reporting components. Query state
 * lives in a `@m3kit/state` store that feeds the table's inputs and
 * consumes its outputs.
 */
@Component({
  selector: 'app-customers-report',
  imports: [TableFilterBarComponent, DataTableComponent, PageToolbarComponent],
  providers: [CustomersReportStore],
  templateUrl: './customers-report.component.html',
  styleUrl: './customers-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersReportComponent {
  protected readonly definition: TableDefinition<Customer> = CUSTOMERS_TABLE_DEFINITION;

  protected readonly dataSource = new InMemoryTableDataSource<Customer>(CUSTOMERS);

  /** Drives the toolbar count and the table's filter inputs. */
  protected readonly store = inject(CustomersReportStore);

  /** Last customer the user clicked (selection is tracked by id in the store). */
  protected readonly selectedCustomer = computed(
    () => CUSTOMERS.find((customer) => this.store.isSelected()(customer)) ?? null,
  );

  constructor() {
    this.store.connect(this.dataSource);
  }

  protected onFilterChange(change: TableFilterBarChange): void {
    this.store.setTextFilter(change.text);
  }

  protected onRowClicked(customer: Customer): void {
    this.store.clear();
    this.store.select(customer);
  }
}
