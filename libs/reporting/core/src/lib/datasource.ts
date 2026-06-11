import type { Observable } from 'rxjs';

import type { ReportPage, ReportQuery } from './query';

/**
 * Contract every report data source implements.
 *
 * The contract is deliberately *connect-free* — unlike the CDK
 * `DataSource`, there is no `connect`/`disconnect` lifecycle and no
 * long-lived stream owned by the source:
 *
 * - `fetch` is a pure request/response call: it receives the complete
 *   query (filter + sort + page) and returns a cold observable that
 *   emits exactly one `ReportPage<T>` and then completes.
 * - Implementations must not retain subscriptions or per-view state;
 *   each call is independent and safe to retry, race (e.g. via
 *   `switchMap`), or cancel by unsubscribing.
 * - Reactivity lives in the caller: views re-invoke `fetch` whenever
 *   their query state changes.
 *
 * Errors are reported through the observable's error channel.
 */
export interface ReportDataSource<T> {
  /**
   * Executes the query and resolves to a single page of results.
   * `totalCount` reflects the filtered (pre-pagination) row count.
   */
  fetch(query: ReportQuery): Observable<ReportPage<T>>;
}
