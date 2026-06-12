import type { ReportError } from './report-error';

/**
 * Explicit fetch-lifecycle state for a report view, as a discriminated
 * union keyed on `kind`. The six kinds are the kit-wide taxonomy:
 *
 * - `idle` — no fetch requested yet; nothing to show.
 * - `loading` — first fetch in flight; nothing to show yet.
 * - `refreshing` — a fetch is in flight while previous data is retained
 *   and should stay on screen.
 * - `success` — data available; `stale` marks it valid-but-known-outdated.
 * - `empty` — a fetch succeeded with zero rows; `stale` as above.
 * - `error` — a fetch failed with a normalized {@link ReportError};
 *   `data` carries the last good value when one exists.
 *
 * `stale` (a flag on settled data-bearing kinds) is distinct from
 * `refreshing` (a fetch actually in flight): stale data is a refresh
 * *affordance* hook, refreshing is refresh *in progress*.
 */
export type LoadState<T> =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'refreshing'; readonly data: T }
  | { readonly kind: 'success'; readonly data: T; readonly stale: boolean }
  | { readonly kind: 'empty'; readonly stale: boolean }
  | { readonly kind: 'error'; readonly error: ReportError; readonly data?: T };

/** The discriminant values of {@link LoadState}. */
export type LoadStateKind = LoadState<unknown>['kind'];

/** Type guard for the `idle` kind. */
export function isIdle<T>(state: LoadState<T>): state is Extract<LoadState<T>, { kind: 'idle' }> {
  return state.kind === 'idle';
}

/** Type guard for the `loading` kind (first load, nothing to show). */
export function isLoading<T>(state: LoadState<T>): state is Extract<LoadState<T>, { kind: 'loading' }> {
  return state.kind === 'loading';
}

/** Type guard for the `refreshing` kind (in flight, previous data retained). */
export function isRefreshing<T>(state: LoadState<T>): state is Extract<LoadState<T>, { kind: 'refreshing' }> {
  return state.kind === 'refreshing';
}

/** Type guard for the `success` kind. */
export function isSuccess<T>(state: LoadState<T>): state is Extract<LoadState<T>, { kind: 'success' }> {
  return state.kind === 'success';
}

/** Type guard for the `empty` kind (successful fetch, zero rows). */
export function isEmpty<T>(state: LoadState<T>): state is Extract<LoadState<T>, { kind: 'empty' }> {
  return state.kind === 'empty';
}

/** Type guard for the `error` kind. */
export function isError<T>(state: LoadState<T>): state is Extract<LoadState<T>, { kind: 'error' }> {
  return state.kind === 'error';
}

/**
 * Reads the data off any data-bearing kind (`refreshing`, `success`, or
 * `error` with a retained last-good value); `undefined` for `idle`,
 * `loading`, `empty`, and data-less `error`.
 */
export function loadStateData<T>(state: LoadState<T>): T | undefined {
  switch (state.kind) {
    case 'refreshing':
    case 'success':
      return state.data;
    case 'error':
      return state.data;
    default:
      return undefined;
  }
}

/**
 * `true` when the state is a settled data-bearing kind flagged stale
 * (`success` or `empty` with `stale: true`).
 */
export function isStale<T>(state: LoadState<T>): boolean {
  return (state.kind === 'success' || state.kind === 'empty') && state.stale;
}
