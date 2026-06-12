import type { ReportTelemetryEvent } from '@m3kit/core';

import { ConsoleTelemetryReporter } from './console-telemetry';

function event(): ReportTelemetryEvent {
  return {
    type: 'report.export_completed',
    reportId: 'invoices',
    at: '2026-06-12T10:00:00.000Z',
    correlationId: 'corr-1',
    format: 'csv',
    scope: 'page',
    rowCount: 12,
  };
}

describe('ConsoleTelemetryReporter', () => {
  let groupCollapsedSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let groupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    groupCollapsedSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs each event in a collapsed console group with stable identifying text', () => {
    const reporter = new ConsoleTelemetryReporter();
    const telemetryEvent = event();

    reporter.report(telemetryEvent);

    expect(groupCollapsedSpy).toHaveBeenCalledWith(
      '[report telemetry] report.export_completed invoices',
    );
    expect(logSpy).toHaveBeenCalledWith(telemetryEvent);
    expect(groupEndSpy).toHaveBeenCalledTimes(1);
  });

  it('logs the original event object without mutating it', () => {
    const reporter = new ConsoleTelemetryReporter();
    const telemetryEvent = event();
    const before = structuredClone(telemetryEvent);

    reporter.report(telemetryEvent);

    expect(telemetryEvent).toEqual(before);
    expect(logSpy.mock.calls[0][0]).toBe(telemetryEvent);
  });
});
