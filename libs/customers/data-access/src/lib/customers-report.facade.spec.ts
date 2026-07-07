import { TestBed } from '@angular/core/testing';

import { CustomersReportFacade } from './customers-report.facade';

describe('CustomersReportFacade', () => {
  it('starts in pending manual review until source behavior is ported', () => {
    const facade = TestBed.inject(CustomersReportFacade);

    expect(facade.state().status).toBe('pending-manual-review');
    expect(facade.state().manualReviewItems.length).toBeGreaterThan(0);
  });
});
