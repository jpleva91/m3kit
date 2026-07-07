import { TestBed } from '@angular/core/testing';

import { CustomersReportSummaryComponent } from './customers-report-summary.component';

describe('CustomersReportSummaryComponent', () => {
  it('renders pending manual-review items', async () => {
    await TestBed.configureTestingModule({ imports: [CustomersReportSummaryComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CustomersReportSummaryComponent);
    fixture.componentRef.setInput('state', { status: 'pending-manual-review', sourceFiles: ['source.ts'], manualReviewItems: ['Write RED first'] });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Write RED first');
  });
});
