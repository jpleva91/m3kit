import { Injectable } from '@angular/core';
import type { ReportTelemetryEvent, ReportTelemetryReporter } from '@m3kit/core';

/** Console-backed demo telemetry sink. Consumers should replace this at the app boundary. */
@Injectable({ providedIn: 'root' })
export class ConsoleTelemetryReporter implements ReportTelemetryReporter {
  report(event: ReportTelemetryEvent): void {
    try {
      console.groupCollapsed(`[report telemetry] ${event.type} ${event.reportId}`);
      console.log(event);
    } catch {
      // Telemetry sinks must not throw into report workflows.
    } finally {
      try {
        console.groupEnd();
      } catch {
        // Ignore console adapter failures for the same reason.
      }
    }
  }
}
