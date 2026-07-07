import { Injectable, signal } from '@angular/core';

export interface CustomersReportPortState {
  readonly status: 'pending-manual-review' | 'ready-for-wiring';
  readonly sourceFiles: readonly string[];
  readonly manualReviewItems: readonly string[];
}

const CUSTOMERS_REPORT_INITIAL_STATE: CustomersReportPortState = {
  status: 'pending-manual-review',
  sourceFiles: [
  "apps/demo-reporting/src/app/reports/customers-report.component.ts",
  "apps/demo-reporting/src/app/reports/report-url-state.ts"
],
  manualReviewItems: [
  "Review apps/demo-reporting/src/app/reports/report-url-state.ts: Store/effects data flow needs manual review before porting."
],
};

@Injectable({ providedIn: 'root' })
export class CustomersReportFacade {
  readonly state = signal<CustomersReportPortState>(CUSTOMERS_REPORT_INITIAL_STATE);
}
