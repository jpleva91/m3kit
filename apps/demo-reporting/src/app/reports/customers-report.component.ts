import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { patchState, signalStore, type WritableStateSource } from '@ngrx/signals';
import {
  InMemoryTableDataSource,
  TableDefinition,
  type DataQuery,
  type PageState,
  type SortState,
} from '@m3kit/core';
import { withDataQuery, withSelection } from '@m3kit/state';
import {
  TableFilterBarChange,
  TableFilterBarComponent,
  DataTableComponent,
  PageToolbarComponent,
} from '@m3kit/table';
import { CUSTOMERS_TABLE_DEFINITION, Customer, makeCustomers } from '@m3kit/testing';

import { readReportUrlState, syncReportUrlQuery } from './report-url-state';

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
 * demonstrating reusability of the reporting components. The
 * `@m3kit/state` store is the single fetch path: it owns the query and
 * the fetched page, and the table runs in controlled mode driven
 * entirely by store state and `sortChange`/`pageChange` events.
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

  /** Single source of truth: fetches pages and drives the table and toolbar. */
  protected readonly store = inject(CustomersReportStore);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  /** Last customer the user clicked (selection is tracked by id in the store). */
  protected readonly selectedCustomer = computed(
    () => CUSTOMERS.find((customer) => this.store.isSelected()(customer)) ?? null,
  );

  constructor() {
    // Seed the store from the URL helper before the first (and only)
    // fetch that `connect` runs. Missing/garbage URLs fall back to the
    // report definition's default sort.
    const sort = this.definition.defaultSort;
    const defaultQuery: DataQuery = {
      filter: {},
      sort: sort ? { key: sort.key, direction: sort.direction } : null,
      page: { index: 0, size: 10 },
    };
    patchState(
      this.store as unknown as WritableStateSource<{ query: DataQuery }>,
      { query: readReportUrlState(this.route, defaultQuery).query },
    );
    this.store.connect(this.dataSource);
  }

  protected onFilterChange(change: TableFilterBarChange): void {
    const query = withTextFilter(this.store.query(), change.text);
    this.store.setTextFilter(change.text);
    void syncReportUrlQuery(this.router, this.route, query);
  }

  protected onSortChange(sort: SortState | null): void {
    const query: DataQuery = {
      ...this.store.query(),
      sort,
      page: { ...this.store.page(), index: 0 },
    };
    this.store.setSort(sort);
    void syncReportUrlQuery(this.router, this.route, query);
  }

  protected onPageChange(page: PageState): void {
    const query: DataQuery = { ...this.store.query(), page };
    this.store.setPage(page);
    void syncReportUrlQuery(this.router, this.route, query);
  }

  protected onRowClicked(customer: Customer): void {
    this.store.clear();
    this.store.select(customer);
  }
}

function withTextFilter(query: DataQuery, text: string): DataQuery {
  const nextText = text.trim() || undefined;
  return {
    ...query,
    filter: { ...query.filter, text: nextText },
    page: { ...query.page, index: 0 },
  };
}
