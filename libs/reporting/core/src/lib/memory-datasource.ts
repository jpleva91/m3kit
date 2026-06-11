import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import type { ReportDataSource } from './datasource';
import type { ReportFilterState, ReportPage, ReportQuery, ReportSortState } from './query';

/** Options for `InMemoryReportDataSource`. */
export interface InMemoryReportDataSourceOptions<T> {
  /**
   * Keys the free-text filter searches across (values are stringified
   * before matching, so numeric ids are searchable). When omitted, the
   * text filter searches all string-valued fields of each row.
   */
  readonly textSearchKeys?: readonly (keyof T & string)[];

  /**
   * Simulated network latency in milliseconds applied to every `fetch`.
   * Defaults to `0` (synchronous emission).
   */
  readonly latencyMs?: number;
}

/**
 * Synchronous, array-backed `ReportDataSource` implementing the full
 * query contract: case-insensitive text filtering, exact-match field
 * filtering, type-aware sorting (string/number/date), and pagination.
 *
 * Intended for demos, tests, and small client-side datasets. The input
 * array is copied at construction; later mutations of the original
 * array do not affect results.
 */
export class InMemoryReportDataSource<T> implements ReportDataSource<T> {
  private readonly rows: readonly T[];
  private readonly textSearchKeys?: readonly (keyof T & string)[];
  private readonly latencyMs: number;

  constructor(rows: readonly T[], options: InMemoryReportDataSourceOptions<T> = {}) {
    this.rows = [...rows];
    this.textSearchKeys = options.textSearchKeys;
    this.latencyMs = options.latencyMs ?? 0;
  }

  /**
   * Executes the query against the in-memory rows. Emits once, then
   * completes. Construct with `latencyMs > 0` to simulate network latency.
   */
  fetch(query: ReportQuery): Observable<ReportPage<T>> {
    const filtered = this.applyFieldFilters(this.applyTextFilter(this.rows, query.filter), query.filter);
    const sorted = this.applySort(filtered, query.sort);
    const page = this.paginate(sorted, query);
    return this.latencyMs > 0 ? of(page).pipe(delay(this.latencyMs)) : of(page);
  }

  private applyTextFilter(rows: readonly T[], filter: ReportFilterState): readonly T[] {
    const needle = filter.text?.trim().toLowerCase();
    if (!needle) {
      return rows;
    }
    return rows.filter((row) => {
      const record = row as Record<string, unknown>;
      if (this.textSearchKeys) {
        return this.textSearchKeys.some((key) => this.matchesText(record[key], needle));
      }
      return Object.values(record).some((value) => typeof value === 'string' && this.matchesText(value, needle));
    });
  }

  private matchesText(value: unknown, needle: string): boolean {
    return value != null && String(value).toLowerCase().includes(needle);
  }

  private applyFieldFilters(rows: readonly T[], filter: ReportFilterState): readonly T[] {
    const entries = Object.entries(filter.fields ?? {}).filter(([, expected]) => expected !== undefined);
    if (entries.length === 0) {
      return rows;
    }
    return rows.filter((row) => {
      const record = row as Record<string, unknown>;
      return entries.every(([key, expected]) => this.valuesEqual(record[key], expected));
    });
  }

  private valuesEqual(actual: unknown, expected: unknown): boolean {
    if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();
    }
    return actual === expected;
  }

  private applySort(rows: readonly T[], sort: ReportSortState | null): readonly T[] {
    if (!sort) {
      return rows;
    }
    const direction = sort.direction === 'desc' ? -1 : 1;
    return [...rows].sort((rowA, rowB) => {
      const a = (rowA as Record<string, unknown>)[sort.key];
      const b = (rowB as Record<string, unknown>)[sort.key];
      // Nullish values sort last regardless of direction.
      if (a == null && b == null) {
        return 0;
      }
      if (a == null) {
        return 1;
      }
      if (b == null) {
        return -1;
      }
      return this.compareValues(a, b) * direction;
    });
  }

  private compareValues(a: unknown, b: unknown): number {
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return Number(a) - Number(b);
    }
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }

  private paginate(rows: readonly T[], query: ReportQuery): ReportPage<T> {
    const size = Math.max(1, Math.floor(query.page.size));
    const index = Math.max(0, Math.floor(query.page.index));
    const start = index * size;
    return {
      rows: rows.slice(start, start + size),
      totalCount: rows.length,
      pageIndex: index,
      pageSize: size,
    };
  }
}
