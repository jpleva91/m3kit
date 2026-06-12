import { InjectionToken } from '@angular/core';

import type { ReportTelemetryReporter } from '@m3kit/core';

const NOOP_REPORT_TELEMETRY_REPORTER: ReportTelemetryReporter = {
  report: () => {
    // Default sink intentionally drops events. Apps can provide a concrete
    // reporter (console, analytics SDK, OTLP, etc.) at their boundary.
  },
};

/**
 * Angular injection token for report telemetry sinks.
 *
 * The default factory is a no-op so reusable state features can emit
 * telemetry without requiring consumers to configure reporting.
 */
export const REPORT_TELEMETRY_REPORTER = new InjectionToken<ReportTelemetryReporter>(
  'REPORT_TELEMETRY_REPORTER',
  { factory: () => NOOP_REPORT_TELEMETRY_REPORTER }
);
