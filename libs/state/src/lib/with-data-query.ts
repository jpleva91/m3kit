import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  EMPTY,
  type Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  pipe,
  switchMap,
  tap,
} from 'rxjs';

import {
  DEFAULT_PAGE_SIZE,
  createDefaultQuery,
  type DataQuery,
  type FilterState,
  type PageState,
  type SortState,
  type TableDataSource,
} from '@m3kit/core';

/** Milliseconds `setTextFilter` waits before applying the text filter. */
export const TEXT_FILTER_DEBOUNCE_MS = 300;

/** Options for `withDataQuery`. */
export interface WithDataQueryOptions {
  /**
   * Debounce window for `setTextFilter`, in milliseconds.
   * Defaults to `TEXT_FILTER_DEBOUNCE_MS` (300).
   */
  readonly debounceMs?: number;
  /** Page size of the initial query. Defaults to `DEFAULT_PAGE_SIZE` (25). */
  readonly initialPageSize?: number;
}

/** State slice managed by `withDataQuery`. */
export interface DataQueryState<T> {
  /** The complete query (filter + sort + page) sent to the data source. */
  query: DataQuery;
  /** Rows of the most recently fetched page. */
  rows: readonly T[];
  /** Filtered (pre-pagination) row count from the last fetch. */
  totalCount: number;
  /** Whether a fetch is in flight. */
  loading: boolean;
  /** Message of the last fetch error, or `null` when the last fetch succeeded. */
  error: string | null;
}

function createInitialState<T>(pageSize: number): DataQueryState<T> {
  return {
    query: createDefaultQuery(pageSize),
    rows: [],
    totalCount: 0,
    loading: false,
    error: null,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
}

/**
 * Minimal clean-room equivalent of `tapResponse` from `@ngrx/operators`,
 * kept local because the kit's dependency surface is limited to
 * `@ngrx/signals` (see THE CONTRACT, rule 4): taps `next`, routes errors
 * to a handler, and completes the inner stream so the outer `rxMethod`
 * subscription survives fetch failures.
 */
function tapResponse<T>(observer: {
  next: (value: T) => void;
  error: (error: unknown) => void;
}): (source$: Observable<T>) => Observable<T> {
  return (source$) =>
    source$.pipe(
      tap({ next: observer.next }),
      catchError((error: unknown) => {
        observer.error(error);
        return EMPTY;
      })
    );
}

/**
 * SignalStore feature that owns the full report-query lifecycle for a
 * `TableDataSource<T>`: filter (debounced free text + exact-match fields),
 * sort, pagination, and the fetched page (`rows`/`totalCount`/`loading`/
 * `error`).
 *
 * Reactivity follows the connect-free `TableDataSource` contract: every
 * query mutation re-invokes `fetch` through a single `switchMap`ped
 * `rxMethod`, so stale in-flight responses are cancelled and the newest
 * query always wins.
 *
 * ```ts
 * const InvoiceStore = signalStore(withDataQuery<Invoice>());
 *
 * // in a component
 * readonly store = inject(InvoiceStore);
 * ngOnInit() {
 *   this.store.connect(this.dataSource);
 * }
 * ```
 */
export function withDataQuery<T>(options: WithDataQueryOptions = {}) {
  const debounceMs = options.debounceMs ?? TEXT_FILTER_DEBOUNCE_MS;
  const initialPageSize = options.initialPageSize ?? DEFAULT_PAGE_SIZE;

  return signalStoreFeature(
    withState<DataQueryState<T>>(createInitialState<T>(initialPageSize)),
    // Non-reactive connection holder; `_`-prefixed members stay private.
    withProps(() => ({
      _connection: { dataSource: null as TableDataSource<T> | null },
    })),
    withComputed(({ query, rows, totalCount, loading }) => ({
      /** Current free-text filter (empty string when unset). */
      textFilter: computed(() => query().filter.text ?? ''),
      /** Current per-field exact-match filters. */
      fieldFilters: computed(() => query().filter.fields ?? {}),
      /** Current sort, or `null` when unsorted. */
      sort: computed(() => query().sort),
      /** Current pagination state. */
      page: computed(() => query().page),
      /** Number of pages implied by `totalCount` and the page size. */
      pageCount: computed(() =>
        Math.ceil(totalCount() / Math.max(1, query().page.size))
      ),
      /** True when a completed fetch matched no rows. */
      isEmpty: computed(() => !loading() && rows().length === 0),
    })),
    withMethods((store) => {
      const fetchQuery = rxMethod<DataQuery>(
        pipe(
          switchMap((query) => {
            const dataSource = store._connection.dataSource;
            if (!dataSource) {
              return EMPTY;
            }
            patchState(store, { loading: true, error: null });
            return dataSource.fetch(query).pipe(
              tapResponse({
                next: (page) =>
                  patchState(store, {
                    rows: page.rows,
                    totalCount: page.totalCount,
                    loading: false,
                  }),
                error: (error) =>
                  patchState(store, {
                    loading: false,
                    error: errorMessage(error),
                  }),
              })
            );
          })
        )
      );

      const applyQuery = (update: (query: DataQuery) => DataQuery): void => {
        patchState(store, (state) => ({ query: update(state.query) }));
        fetchQuery(store.query());
      };

      const setFilter = (patch: Partial<FilterState>): void =>
        applyQuery((query) => ({
          ...query,
          filter: { ...query.filter, ...patch },
          // Filter changes invalidate the page offset.
          page: { ...query.page, index: 0 },
        }));

      return {
        /**
         * Connects the store to a data source and runs the current query.
         * Reconnecting replaces the source and refetches.
         */
        connect(dataSource: TableDataSource<T>): void {
          store._connection.dataSource = dataSource;
          fetchQuery(store.query());
        },

        /** Re-runs the current query against the connected data source. */
        refresh(): void {
          fetchQuery(store.query());
        },

        /**
         * Sets the free-text filter, debounced (`debounceMs`) and
         * deduplicated. Empty/whitespace text clears the filter. Resets
         * to the first page.
         */
        setTextFilter: rxMethod<string>(
          pipe(
            debounceTime(debounceMs),
            distinctUntilChanged(),
            tap((text) => setFilter({ text: text.trim() || undefined }))
          )
        ),

        /**
         * Replaces the per-field exact-match filters. Resets to the
         * first page.
         */
        setFieldFilters(fields: Readonly<Record<string, unknown>>): void {
          setFilter({ fields });
        },

        /** Sets (or clears) the sort. Resets to the first page. */
        setSort(sort: SortState | null): void {
          applyQuery((query) => ({
            ...query,
            sort,
            page: { ...query.page, index: 0 },
          }));
        },

        /** Sets pagination (zero-based page index + page size). */
        setPage(page: PageState): void {
          applyQuery((query) => ({ ...query, page }));
        },
      };
    })
  );
}
