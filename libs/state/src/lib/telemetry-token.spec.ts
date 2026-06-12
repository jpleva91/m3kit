import { TestBed } from '@angular/core/testing';

import type { ReportTelemetryEvent } from '@m3kit/core';

import { REPORT_TELEMETRY_REPORTER } from './telemetry-token';

describe('REPORT_TELEMETRY_REPORTER', () => {
  it('injects a no-op reporter when no provider is registered', () => {
    TestBed.configureTestingModule({});

    const reporter = TestBed.inject(REPORT_TELEMETRY_REPORTER);
    const event: ReportTelemetryEvent = {
      type: 'report.fetch_started',
      reportId: 'invoices',
      at: new Date(0).toISOString(),
      queryHash: '00000000',
    };

    expect(() => reporter.report(event)).not.toThrow();
  });
});
