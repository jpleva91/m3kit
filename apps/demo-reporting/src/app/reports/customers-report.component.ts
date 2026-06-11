import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { InMemoryReportDataSource, ReportDefinition } from '@reporting/core';
import {
  ReportFilterBarChange,
  ReportFilterBarComponent,
  ReportTableComponent,
  ReportToolbarComponent,
} from '@reporting/material';
import { CUSTOMERS_REPORT_DEFINITION, Customer, makeCustomers } from '@reporting/testing';

/** Seed for the synthetic customer fixtures, so the demo is deterministic. */
const CUSTOMER_SEED = 1;

/**
 * Customers report demo: reuses the exact same building blocks as the
 * invoices report (`rpt-report-toolbar`, `rpt-report-filter-bar`,
 * `rpt-report-table`) with a different definition and data source,
 * demonstrating reusability of the reporting components.
 */
@Component({
  selector: 'app-customers-report',
  imports: [ReportFilterBarComponent, ReportTableComponent, ReportToolbarComponent],
  templateUrl: './customers-report.component.html',
  styleUrl: './customers-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersReportComponent {
  protected readonly definition: ReportDefinition<Customer> = CUSTOMERS_REPORT_DEFINITION;

  protected readonly dataSource = new InMemoryReportDataSource<Customer>(
    makeCustomers(120, CUSTOMER_SEED),
  );

  /** Debounced text from the filter bar, fed into the table. */
  protected readonly filterText = signal('');

  /** Last customer the user clicked, surfaced under the table. */
  protected readonly selectedCustomer = signal<Customer | null>(null);

  protected onFilterChange(change: ReportFilterBarChange): void {
    this.filterText.set(change.text);
  }

  protected onRowClicked(customer: Customer): void {
    this.selectedCustomer.set(customer);
  }
}
