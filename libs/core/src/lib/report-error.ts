/**
 * Closed taxonomy of report failure kinds. Every failure surfaced by the
 * reporting foundation is normalized to exactly one of these; consumers
 * can exhaustively switch on `kind` without defensive default arms for
 * vendor-specific codes.
 */
export type ReportErrorKind =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'not-found'
  | 'forbidden'
  | 'internal'
  | 'unknown';

/** All members of the {@link ReportErrorKind} taxonomy, in stable order. */
export const REPORT_ERROR_KINDS: readonly ReportErrorKind[] = [
  'network',
  'timeout',
  'validation',
  'not-found',
  'forbidden',
  'internal',
  'unknown',
];

/**
 * Normalized report failure.
 *
 * `details` is PII-safe by contract: only non-sensitive, technical
 * string values (e.g. an HTTP status, a field name) may be carried —
 * never row data, filter text, or user identifiers.
 */
export interface ReportError {
  /** Failure classification from the closed taxonomy. */
  readonly kind: ReportErrorKind;
  /** Human-readable description of the failure. */
  readonly message: string;
  /** Whether retrying the same operation could plausibly succeed. */
  readonly retryable: boolean;
  /** Optional correlation id linking the failure to logs/telemetry. */
  readonly correlationId?: string;
  /** Optional PII-safe technical context (see interface docs). */
  readonly details?: Readonly<Record<string, string>>;
}

/** Message used when a failure carries no usable text of its own. */
const FALLBACK_MESSAGE = 'An unexpected error occurred.';

/** Kinds for which a retry could plausibly succeed. */
const RETRYABLE_KINDS: ReadonlySet<ReportErrorKind> = new Set([
  'network',
  'timeout',
]);

/**
 * Default `retryable` flag for a kind: transient transport failures
 * (`network`, `timeout`) are retryable; everything else is not.
 */
export function isRetryableKind(kind: ReportErrorKind): boolean {
  return RETRYABLE_KINDS.has(kind);
}

/**
 * Type guard: `true` when `value` already satisfies the {@link ReportError}
 * shape — a `kind` from the closed taxonomy, a string `message`, and a
 * boolean `retryable` flag (optional fields type-checked when present).
 */
export function isReportError(value: unknown): value is ReportError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['kind'] === 'string' &&
    (REPORT_ERROR_KINDS as readonly string[]).includes(candidate['kind']) &&
    typeof candidate['message'] === 'string' &&
    typeof candidate['retryable'] === 'boolean' &&
    (candidate['correlationId'] === undefined ||
      typeof candidate['correlationId'] === 'string') &&
    (candidate['details'] === undefined ||
      isStringRecord(candidate['details']))
  );
}

function isStringRecord(value: unknown): value is Readonly<Record<string, string>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === 'string');
}

/**
 * Normalizes any thrown value into a {@link ReportError}. Never throws.
 *
 * - Values already satisfying the `ReportError` shape pass through as-is.
 * - `Error` instances contribute their `message`.
 * - Non-empty strings become the message directly.
 * - Everything else becomes a generic message — raw values are never
 *   stringified into the message, keeping unknown payloads out of UI
 *   text and telemetry.
 *
 * The result's `retryable` flag follows {@link isRetryableKind} for the
 * resolved `fallbackKind`.
 */
export function toReportError(
  error: unknown,
  fallbackKind: ReportErrorKind = 'unknown',
): ReportError {
  try {
    if (isReportError(error)) {
      return error;
    }
    if (error instanceof Error) {
      return {
        kind: fallbackKind,
        message: error.message.trim() !== '' ? error.message : FALLBACK_MESSAGE,
        retryable: isRetryableKind(fallbackKind),
      };
    }
    if (typeof error === 'string' && error.trim() !== '') {
      return {
        kind: fallbackKind,
        message: error,
        retryable: isRetryableKind(fallbackKind),
      };
    }
    return {
      kind: fallbackKind,
      message: FALLBACK_MESSAGE,
      retryable: isRetryableKind(fallbackKind),
    };
  } catch {
    // Property access on hostile objects (e.g. throwing getters) must not
    // propagate — normalization is a terminal safety net.
    return { kind: 'unknown', message: FALLBACK_MESSAGE, retryable: false };
  }
}
