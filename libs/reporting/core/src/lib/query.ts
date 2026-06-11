/** Direction of a sort. */
export type SortDirection = 'asc' | 'desc';

/**
 * Active sort state for a report. `key` is constrained to string keys of
 * the row type when one is supplied; defaults to any string for callers
 * that work untyped (e.g. serialized query state).
 */
export interface ReportSortState<T = Record<string, unknown>> {
  readonly key: keyof T & string;
  readonly direction: SortDirection;
}

/** Active filter state for a report. */
export interface ReportFilterState {
  /**
   * Free-text search applied across searchable fields,
   * case-insensitively. Empty/whitespace-only text means "no text filter".
   */
  readonly text?: string;
  /**
   * Per-field exact-match filters, keyed by row property name.
   * `undefined` values are ignored.
   */
  readonly fields?: Readonly<Record<string, unknown>>;
}

/** Active pagination state for a report. Page indexes are zero-based. */
export interface ReportPageState {
  readonly index: number;
  readonly size: number;
}

/**
 * Complete query a report view sends to a `ReportDataSource`:
 * filtering, sorting, and pagination.
 */
export interface ReportQuery {
  readonly filter: ReportFilterState;
  readonly sort: ReportSortState | null;
  readonly page: ReportPageState;
}

/**
 * One page of report results, as returned by a `ReportDataSource`.
 * `totalCount` is the number of rows matching the filter *before*
 * pagination, so views can render paginators.
 */
export interface ReportPage<T> {
  readonly rows: readonly T[];
  readonly totalCount: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

/** Page size used when a report does not declare `defaultPageSize`. */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Creates a neutral query: no text filter, no field filters, no sort,
 * first page at the given size.
 */
export function createDefaultQuery(pageSize: number = DEFAULT_PAGE_SIZE): ReportQuery {
  return {
    filter: {},
    sort: null,
    page: { index: 0, size: pageSize },
  };
}

/**
 * Creates an empty result page, useful as an initial value before the
 * first fetch resolves.
 */
export function createEmptyPage<T>(query: ReportQuery = createDefaultQuery()): ReportPage<T> {
  return {
    rows: [],
    totalCount: 0,
    pageIndex: query.page.index,
    pageSize: query.page.size,
  };
}
