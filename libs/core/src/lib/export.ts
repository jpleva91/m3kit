import type { ColumnType } from './models';
import type { SerializedDataQuery } from './query-serialization';
import { toReportError, type ReportError } from './report-error';
import type { ReportFormattingPolicy } from './temporal';

/**
 * Baseline export formats shipped by the kit. Richer formats (XLSX, PDF,
 * server-side export jobs) are adapter/consumer territory — see
 * `docs/REPORTING_FOUNDATION.md` for the baseline-vs-adapter boundary.
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Which rows an export covers: the current page, all rows matching the
 * query's filter, or an explicit selection (identified by `rowIds` on the
 * request).
 */
export type ExportScope = 'page' | 'all' | 'selection';

/** Media type emitted for each baseline {@link ExportFormat}. */
export const EXPORT_MEDIA_TYPES: Readonly<Record<ExportFormat, string>> = {
  csv: 'text/csv',
  json: 'application/json',
};

/**
 * Projection of one report column into an export: which row property to
 * read, the header to label it with, and an optional {@link ColumnType}
 * that enables policy-aware value formatting.
 */
export interface ExportColumn {
  /** Row property this export column reads. */
  readonly key: string;
  /** Header label written to the export output. */
  readonly header: string;
  /** Column type enabling policy-aware formatting (date/number/currency). */
  readonly type?: ColumnType;
}

/**
 * Immutable snapshot of what to export: the report, the format and scope,
 * the serialized query at the moment of the request, and the column
 * projection. The request carries everything an export pipeline (baseline
 * helpers here, or a consumer's server-side job) needs to reproduce the
 * export later.
 */
export interface ExportRequest {
  /** Stable report identifier (matches `TableDefinition.id`). */
  readonly reportId: string;
  /** Output format. */
  readonly format: ExportFormat;
  /** Which rows the export covers. */
  readonly scope: ExportScope;
  /** Base name for the output file (sanitized by the filename builder). */
  readonly fileBaseName: string;
  /** Serialized query snapshot at the moment of the request. */
  readonly query: SerializedDataQuery;
  /** Ordered column projection applied to each row. */
  readonly columns: readonly ExportColumn[];
  /** Row identifiers for `scope: 'selection'` exports. */
  readonly rowIds?: readonly string[];
  /** UTC ISO instant at which the export was requested. */
  readonly requestedAt: string;
}

/**
 * Discriminated outcome of an export: either the produced file content
 * (with filename, media type, and row count) or a normalized
 * {@link ReportError}. Both arms retain the originating request.
 */
export type ExportResult =
  | {
      readonly kind: 'success';
      readonly request: ExportRequest;
      readonly filename: string;
      readonly mediaType: string;
      readonly content: string;
      readonly rowCount: number;
    }
  | {
      readonly kind: 'error';
      readonly request: ExportRequest;
      readonly error: ReportError;
    };

/**
 * Stringifies a single cell value without any policy: `null`/`undefined`
 * become the empty string, `Date`s become UTC ISO instants (deterministic,
 * unlike `Date#toString`), everything else is plain `String(...)`.
 */
function plainCellText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

/**
 * Formats a single cell value, applying the {@link ReportFormattingPolicy}
 * via `Intl` for `date`/`number`/`currency` typed columns; all other
 * types (and all values when no policy is given) use plain
 * stringification.
 */
function formatCellValue(
  value: unknown,
  type: ColumnType | undefined,
  policy: ReportFormattingPolicy | undefined,
): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (policy === undefined || type === undefined) {
    return plainCellText(value);
  }
  switch (type) {
    case 'date': {
      const date =
        value instanceof Date
          ? value
          : typeof value === 'string' || typeof value === 'number'
            ? new Date(value)
            : null;
      if (date === null || Number.isNaN(date.getTime())) {
        return plainCellText(value);
      }
      return new Intl.DateTimeFormat(policy.locale, {
        timeZone: policy.timeZone,
      }).format(date);
    }
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return plainCellText(value);
      }
      return new Intl.NumberFormat(policy.locale).format(value);
    }
    case 'currency': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return plainCellText(value);
      }
      if (policy.currencyCode === undefined) {
        return new Intl.NumberFormat(policy.locale).format(value);
      }
      return new Intl.NumberFormat(policy.locale, {
        style: 'currency',
        currency: policy.currencyCode,
      }).format(value);
    }
    default:
      return plainCellText(value);
  }
}

/**
 * Projects rows through an {@link ExportColumn} list into flat records of
 * column key → formatted string. With a {@link ReportFormattingPolicy},
 * `date`/`number`/`currency` typed columns format via `Intl` for the
 * policy's locale/time zone/currency; without one, values are plainly
 * stringified (`Date`s as UTC ISO instants, `null`/`undefined` as `''`).
 */
export function flattenRows<T>(
  rows: readonly T[],
  columns: readonly ExportColumn[],
  policy?: ReportFormattingPolicy,
): readonly Readonly<Record<string, string>>[] {
  return rows.map((row) => {
    const record: Record<string, string> = {};
    for (const column of columns) {
      const value = (row as Record<string, unknown>)[column.key];
      record[column.key] = formatCellValue(value, column.type, policy);
    }
    return record;
  });
}

/**
 * Neutralizes spreadsheet formula injection: cell text starting with `=`,
 * `+`, `-`, or `@` is prefixed with a single quote so spreadsheet
 * applications treat it as text, never as a formula.
 */
function neutralizeFormula(cell: string): string {
  return /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
}

/**
 * RFC-4180-style cell escaping: cells containing a double quote, comma,
 * carriage return, or line feed are wrapped in double quotes with embedded
 * quotes doubled; all other cells pass through unchanged.
 */
function escapeCsvCell(cell: string): string {
  return /["\r\n,]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

/**
 * Renders rows as CSV text: a header row built from the column `header`s,
 * then one line per row in projection order, CRLF-separated. Formatting
 * (via the optional policy) is applied *before* quoting, so locale output
 * containing delimiters is escaped correctly; data cells beginning with
 * `=`, `+`, `-`, or `@` are formula-neutralized with a leading `'`. Zero
 * rows yield the header row alone — still a valid CSV file.
 */
export function rowsToCsv<T>(
  rows: readonly T[],
  columns: readonly ExportColumn[],
  policy?: ReportFormattingPolicy,
): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(',');
  const lines = flattenRows(rows, columns, policy).map((record) =>
    columns
      .map((column) => escapeCsvCell(neutralizeFormula(record[column.key] ?? '')))
      .join(','),
  );
  return [header, ...lines].join('\r\n');
}

/**
 * Renders rows as JSON text: an array of column-key → formatted-value
 * records carrying exactly the same projection (and policy formatting) as
 * {@link rowsToCsv}. Zero rows yield an empty array — still valid JSON.
 */
export function rowsToJson<T>(
  rows: readonly T[],
  columns: readonly ExportColumn[],
  policy?: ReportFormattingPolicy,
): string {
  return JSON.stringify(flattenRows(rows, columns, policy), null, 2);
}

/** Filename used when sanitization leaves nothing of the base name. */
const FALLBACK_FILE_BASE_NAME = 'export';

/**
 * Builds a deterministic, filesystem-safe filename:
 * `<base>_<yyyy-mm-dd>.<format>`. The base name is lowercased and
 * sanitized to `[a-z0-9-_]` (runs of other characters collapse to a
 * single `-`); the date is the calendar date of the given UTC ISO
 * timestamp. Identical inputs always produce identical filenames.
 */
export function buildExportFilename(
  baseName: string,
  format: ExportFormat,
  timestamp: string,
): string {
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = sanitized !== '' ? sanitized : FALLBACK_FILE_BASE_NAME;
  return `${base}_${timestamp.slice(0, 10)}.${format}`;
}

/**
 * Single entry point tying the baseline helpers together: renders `rows`
 * per the request's format and column projection, and returns a
 * `success` {@link ExportResult} carrying content, deterministic filename,
 * media type, and row count — or an `error` result with a normalized
 * {@link ReportError}. Never throws.
 *
 * Core stops at content text by design: triggering a browser download
 * (Blob/anchor) is app-layer code, never core.
 */
export function createExportResult<T>(
  request: ExportRequest,
  rows: readonly T[],
  policy?: ReportFormattingPolicy,
): ExportResult {
  try {
    const content =
      request.format === 'csv'
        ? rowsToCsv(rows, request.columns, policy)
        : rowsToJson(rows, request.columns, policy);
    return {
      kind: 'success',
      request,
      filename: buildExportFilename(
        request.fileBaseName,
        request.format,
        request.requestedAt,
      ),
      mediaType: EXPORT_MEDIA_TYPES[request.format],
      content,
      rowCount: rows.length,
    };
  } catch (error) {
    return { kind: 'error', request, error: toReportError(error, 'internal') };
  }
}
