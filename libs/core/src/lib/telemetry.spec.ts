import {
  REPORT_TELEMETRY_EVENT_TYPES,
  type ReportTelemetryEvent,
  type ReportTelemetryEventType,
  type ReportTelemetryReporter,
} from './telemetry';

/**
 * One event of every variant in the union. Constructing this list is the
 * type-level proof that each variant's payload compiles with exactly the
 * documented fields — query identity via `queryHash`, never raw filter
 * text or row data.
 */
const EVERY_EVENT: readonly ReportTelemetryEvent[] = [
  {
    type: 'report.query_changed',
    reportId: 'invoices',
    at: '2026-06-12T09:00:00.000Z',
    queryHash: '9f86d081',
  },
  {
    type: 'report.fetch_started',
    reportId: 'invoices',
    at: '2026-06-12T09:00:00.100Z',
    queryHash: '9f86d081',
    correlationId: 'fetch-1',
  },
  {
    type: 'report.fetch_succeeded',
    reportId: 'invoices',
    at: '2026-06-12T09:00:00.350Z',
    queryHash: '9f86d081',
    durationMs: 250,
    rowCount: 25,
    totalCount: 311,
  },
  {
    type: 'report.fetch_failed',
    reportId: 'invoices',
    at: '2026-06-12T09:00:05.000Z',
    queryHash: '9f86d081',
    durationMs: 5000,
    errorKind: 'timeout',
    retryable: true,
  },
  {
    type: 'report.empty_result',
    reportId: 'invoices',
    at: '2026-06-12T09:00:01.000Z',
    queryHash: 'a1b2c3d4',
    durationMs: 1000,
  },
  {
    type: 'report.export_requested',
    reportId: 'invoices',
    at: '2026-06-12T09:01:00.000Z',
    format: 'csv',
    scope: 'all',
  },
  {
    type: 'report.export_completed',
    reportId: 'invoices',
    at: '2026-06-12T09:01:00.200Z',
    format: 'csv',
    scope: 'all',
    rowCount: 0,
  },
  {
    type: 'report.export_failed',
    reportId: 'invoices',
    at: '2026-06-12T09:01:02.000Z',
    format: 'json',
    scope: 'page',
    errorKind: 'internal',
  },
  {
    type: 'report.saved_view_created',
    reportId: 'invoices',
    at: '2026-06-12T09:02:00.000Z',
    viewId: 'view-overdue',
  },
  {
    type: 'report.saved_view_applied',
    reportId: 'invoices',
    at: '2026-06-12T09:02:10.000Z',
    viewId: 'view-overdue',
  },
  {
    type: 'report.saved_view_deleted',
    reportId: 'invoices',
    at: '2026-06-12T09:03:00.000Z',
    viewId: 'view-overdue',
  },
];

describe('ReportTelemetryEvent', () => {
  it('constructs every variant of the closed union', () => {
    expect(EVERY_EVENT.map((event) => event.type)).toEqual(
      REPORT_TELEMETRY_EVENT_TYPES,
    );
  });

  it('lists each event type exactly once in stable order', () => {
    expect(REPORT_TELEMETRY_EVENT_TYPES).toHaveLength(11);
    expect(new Set(REPORT_TELEMETRY_EVENT_TYPES).size).toBe(11);
    const expected: readonly ReportTelemetryEventType[] = [
      'report.query_changed',
      'report.fetch_started',
      'report.fetch_succeeded',
      'report.fetch_failed',
      'report.empty_result',
      'report.export_requested',
      'report.export_completed',
      'report.export_failed',
      'report.saved_view_created',
      'report.saved_view_applied',
      'report.saved_view_deleted',
    ];
    expect(REPORT_TELEMETRY_EVENT_TYPES).toEqual(expected);
  });

  it('carries the common fields on every variant', () => {
    for (const event of EVERY_EVENT) {
      expect(typeof event.reportId).toBe('string');
      expect(typeof event.at).toBe('string');
      expect(
        event.correlationId === undefined ||
          typeof event.correlationId === 'string',
      ).toBe(true);
    }
  });

  it('identifies queries by hash only — no field can carry raw filter text or rows', () => {
    // Redaction by construction: the only fields any variant exposes are
    // the ones below. There is no `filter`, `text`, `fields`, `rows`,
    // `query`, or message-bearing field to leak into.
    const allowed = new Set([
      'type',
      'reportId',
      'at',
      'correlationId',
      'queryHash',
      'durationMs',
      'rowCount',
      'totalCount',
      'errorKind',
      'retryable',
      'format',
      'scope',
      'viewId',
    ]);
    for (const event of EVERY_EVENT) {
      for (const key of Object.keys(event)) {
        expect(allowed.has(key)).toBe(true);
      }
    }
  });

  it('query-identified variants expose queryHash, never a query object', () => {
    const hashed = EVERY_EVENT.filter(
      (event): event is Extract<ReportTelemetryEvent, { queryHash: string }> =>
        'queryHash' in event,
    );
    expect(hashed.map((event) => event.type)).toEqual([
      'report.query_changed',
      'report.fetch_started',
      'report.fetch_succeeded',
      'report.fetch_failed',
      'report.empty_result',
    ]);
    for (const event of hashed) {
      expect(typeof event.queryHash).toBe('string');
      expect('query' in event).toBe(false);
      expect('filter' in event).toBe(false);
    }
  });

  it('failure variants carry only the error kind and retryability, no message', () => {
    const failed = EVERY_EVENT.find(
      (event) => event.type === 'report.fetch_failed',
    );
    expect(failed).toBeDefined();
    expect(failed && 'message' in failed).toBe(false);
    expect(failed && 'details' in failed).toBe(false);
  });
});

describe('ReportTelemetryReporter', () => {
  it('is satisfied by any object with a report(event) method', () => {
    const seen: ReportTelemetryEvent[] = [];
    const reporter: ReportTelemetryReporter = {
      report: (event) => {
        seen.push(event);
      },
    };
    for (const event of EVERY_EVENT) {
      reporter.report(event);
    }
    expect(seen).toEqual(EVERY_EVENT);
  });

  it('supports a no-op implementation (the default adapters override)', () => {
    const noop: ReportTelemetryReporter = {
      report: () => {
        // intentionally empty
      },
    };
    expect(() => {
      for (const event of EVERY_EVENT) {
        noop.report(event);
      }
    }).not.toThrow();
  });
});
