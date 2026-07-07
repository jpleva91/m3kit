import { CustomersReportSummaryComponent } from './customers-report-summary.component';

describe(CustomersReportSummaryComponent.name, () => {
  it('renders manual review items', () => {
    cy.mount(CustomersReportSummaryComponent, {
      componentProperties: { state: { status: 'pending-manual-review', sourceFiles: ['source.ts'], manualReviewItems: ['Write RED first'] } },
    });
    cy.contains('Write RED first');
  });
});
