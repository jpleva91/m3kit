import type { ExportFormat, ExportScope } from './export';
import type { ReportErrorKind } from './report-error';

/**
 * REDACTION RULE (binding for every event in this module): events identify
 * queries exclusively by `queryHash` (see `dataQueryHash`) — raw filter
 * text, field filter values, and row data MUST never appear in any event
 * field. Failures contribute only their {@link ReportErrorKind} and
 * `retryable` flag, never messages or details. The union below enforces
 * this by construction: no variant has a field that could carry them.
 */

/** Fields shared by every {@link ReportTelemetryEvent}. */
interface ReportTelemetryEventBase {
  /** Stable report identifier (matches `TableDefinition.id`). */
  readonly reportId: string;
  /** UTC ISO instant at which the event occurred. */
  readonly at: string;
  /** Optional correlation id linking the event to logs/errors. */
  readonly correlationId?: string;
}

/** The active query changed (filter, sort, or page). */
export interface ReportQueryChangedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.query_changed';
  /** Stable hash of the serialized query — never raw filter text. */
  readonly queryHash: string;
}

/** A fetch for the current query started. */
export interface ReportFetchStartedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.fetch_started';
  /** Stable hash of the serialized query — never raw filter text. */
  readonly queryHash: string;
}

/** A fetch resolved with at least one row. */
export interface ReportFetchSucceededEvent extends ReportTelemetryEventBase {
  readonly type: 'report.fetch_succeeded';
  /** Stable hash of the serialized query — never raw filter text. */
  readonly queryHash: string;
  /** Wall-clock duration of the fetch in milliseconds. */
  readonly durationMs: number;
  /** Number of rows on the returned page. */
  readonly rowCount: number;
  /** Total rows matching the filter before pagination. */
  readonly totalCount: number;
}

/** A fetch failed. Carries the error's classification only — no message. */
export interface ReportFetchFailedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.fetch_failed';
  /** Stable hash of the serialized query — never raw filter text. */
  readonly queryHash: string;
  /** Wall-clock duration of the fetch in milliseconds. */
  readonly durationMs: number;
  /** Failure classification from the closed taxonomy. */
  readonly errorKind: ReportErrorKind;
  /** Whether retrying the fetch could plausibly succeed. */
  readonly retryable: boolean;
}

/** A fetch resolved successfully with zero rows. */
export interface ReportEmptyResultEvent extends ReportTelemetryEventBase {
  readonly type: 'report.empty_result';
  /** Stable hash of the serialized query — never raw filter text. */
  readonly queryHash: string;
  /** Wall-clock duration of the fetch in milliseconds. */
  readonly durationMs: number;
}

/** An export was requested. */
export interface ReportExportRequestedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.export_requested';
  readonly format: ExportFormat;
  readonly scope: ExportScope;
}

/** An export produced its file content. */
export interface ReportExportCompletedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.export_completed';
  readonly format: ExportFormat;
  readonly scope: ExportScope;
  /** Number of rows written to the export (0 is a valid export). */
  readonly rowCount: number;
}

/** An export failed. Carries the error's classification only — no message. */
export interface ReportExportFailedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.export_failed';
  readonly format: ExportFormat;
  readonly scope: ExportScope;
  /** Failure classification from the closed taxonomy. */
  readonly errorKind: ReportErrorKind;
}

/** A saved view was created. */
export interface ReportSavedViewCreatedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.saved_view_created';
  /** Saved-view identifier — never the view's query or name text. */
  readonly viewId: string;
}

/** A saved view was applied to a report. */
export interface ReportSavedViewAppliedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.saved_view_applied';
  /** Saved-view identifier — never the view's query or name text. */
  readonly viewId: string;
}

/** A saved view was deleted. */
export interface ReportSavedViewDeletedEvent extends ReportTelemetryEventBase {
  readonly type: 'report.saved_view_deleted';
  /** Saved-view identifier — never the view's query or name text. */
  readonly viewId: string;
}

/**
 * Closed union of every reporting telemetry event. See the redaction rule
 * at the top of this module: query identity is always `queryHash`, never
 * raw filter text; no variant carries row data.
 */
export type ReportTelemetryEvent =
  | ReportQueryChangedEvent
  | ReportFetchStartedEvent
  | ReportFetchSucceededEvent
  | ReportFetchFailedEvent
  | ReportEmptyResultEvent
  | ReportExportRequestedEvent
  | ReportExportCompletedEvent
  | ReportExportFailedEvent
  | ReportSavedViewCreatedEvent
  | ReportSavedViewAppliedEvent
  | ReportSavedViewDeletedEvent;

/** The discriminant values of {@link ReportTelemetryEvent}. */
export type ReportTelemetryEventType = ReportTelemetryEvent['type'];

/**
 * All members of the {@link ReportTelemetryEventType} union, in stable
 * order.
 */
export const REPORT_TELEMETRY_EVENT_TYPES: readonly ReportTelemetryEventType[] = [
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

/**
 * Sink interface adapters implement (console, analytics SDK, OTLP, …).
 * Core owns only this interface and the event union; Angular wiring (the
 * injection token with its no-op default) lives in `@m3kit/state`, and
 * concrete reporters are consumer/app code.
 */
export interface ReportTelemetryReporter {
  /** Reports one event. Implementations must not throw. */
  report(event: ReportTelemetryEvent): void;
}
