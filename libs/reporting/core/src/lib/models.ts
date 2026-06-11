import type { ReportSortState } from './query';

/**
 * Rendering type for a report column. Determines which cell template /
 * formatter a table implementation should use.
 */
export type ReportColumnType = 'text' | 'number' | 'date' | 'currency' | 'badge';

/** Horizontal alignment of a column's header and cells. */
export type ReportColumnAlign = 'start' | 'center' | 'end';

/**
 * Optional, type-specific formatting hints for a column. All values are
 * advisory; renderers fall back to sensible defaults when omitted.
 */
export interface ReportColumnFormat {
  /** ISO 4217 currency code for `currency` columns (e.g. `'USD'`). */
  readonly currencyCode?: string;
  /**
   * Date format string for `date` columns, in Angular `DatePipe` syntax
   * (e.g. `'mediumDate'`, `'yyyy-MM-dd'`).
   */
  readonly dateFormat?: string;
  /**
   * Digits info for `number`/`currency` columns, in Angular `DecimalPipe`
   * syntax (e.g. `'1.0-2'`).
   */
  readonly digitsInfo?: string;
  /**
   * Map from raw cell value to a badge color token for `badge` columns
   * (e.g. `{ open: 'primary', overdue: 'warn' }`).
   */
  readonly badgeColors?: Readonly<Record<string, string>>;
}

/**
 * Definition of a single column in a report, bound to a property of the
 * row type `T`.
 */
export interface ReportColumnDef<T> {
  /** Row property this column reads. Must be a string key of `T`. */
  readonly key: keyof T & string;
  /** Human-readable column header label. */
  readonly header: string;
  /** Rendering type of the column. */
  readonly type: ReportColumnType;
  /** Whether the column offers user-driven sorting. Defaults to `false`. */
  readonly sortable?: boolean;
  /** Whether the column participates in field filtering. Defaults to `false`. */
  readonly filterable?: boolean;
  /** CSS width for the column (e.g. `'120px'`, `'12rem'`, `'20%'`). */
  readonly width?: string;
  /** Alignment of header and cells. Defaults to `'start'`. */
  readonly align?: ReportColumnAlign;
  /** Type-specific formatting hints. */
  readonly format?: ReportColumnFormat;
}

/**
 * Declarative description of a report: identity, columns, and default
 * query behavior. A `ReportDefinition` is pure data — it carries no
 * fetching logic (see `ReportDataSource`).
 */
export interface ReportDefinition<T> {
  /** Stable unique identifier for the report (e.g. `'open-invoices'`). */
  readonly id: string;
  /** Human-readable report title. */
  readonly title: string;
  /** Optional longer description shown alongside the title. */
  readonly description?: string;
  /** Ordered column definitions. */
  readonly columns: readonly ReportColumnDef<T>[];
  /** Sort applied before any user interaction. */
  readonly defaultSort?: ReportSortState<T>;
  /** Page size applied before any user interaction. */
  readonly defaultPageSize?: number;
}
