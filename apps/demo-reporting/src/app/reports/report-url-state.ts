import type { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  createDefaultQuery,
  decodeDataQueryParam,
  encodeDataQueryParam,
  type ColumnViewState,
  type DataQuery,
} from '@m3kit/core';

/** The single query parameter owned by the demo app's report URL policy. */
export const REPORT_QUERY_PARAM = 'q';

/** Minimal route shape used by the helper and easy to stub in specs. */
export interface ReportUrlRoute {
  readonly snapshot: {
    readonly queryParamMap: {
      get(name: string): string | null;
    };
  };
}

/** Minimal router shape used by the helper and easy to stub in specs. */
export interface ReportUrlRouter {
  navigate(commands: readonly unknown[], extras: NavigationExtras): Promise<boolean>;
}

/** Decoded report URL state for app-side pages to seed their stores. */
export interface ReportUrlState {
  readonly query: DataQuery;
  readonly columnState?: readonly ColumnViewState[];
}

/**
 * Reads the initial report state from the route's `q` query parameter.
 *
 * Missing, malformed, or tampered values intentionally degrade to the
 * caller's default query (FR-016) rather than surfacing router/JSON errors
 * during page initialization. Column state is app policy: saved-view flows
 * may pass it alongside the decoded query, but this helper does not encode
 * columns into the `q` parameter.
 */
export function readReportUrlState(
  route: ReportUrlRoute | ActivatedRoute,
  defaultQuery: DataQuery = createDefaultQuery(),
  columnState?: readonly ColumnViewState[],
): ReportUrlState {
  const decoded = decodeDataQueryParam(
    route.snapshot.queryParamMap.get(REPORT_QUERY_PARAM),
  );
  return {
    query: decoded ?? defaultQuery,
    ...(columnState !== undefined ? { columnState } : {}),
  };
}

/**
 * Writes a report query into the route's `q` parameter, preserving the
 * current route and replacing the history entry so every table keystroke or
 * paginator click does not add a back-button stop.
 */
export function syncReportUrlQuery(
  router: ReportUrlRouter | Router,
  route: ReportUrlRoute | ActivatedRoute,
  query: DataQuery,
): Promise<boolean> {
  return router.navigate([], {
    relativeTo: route as ActivatedRoute,
    queryParams: { [REPORT_QUERY_PARAM]: encodeDataQueryParam(query) },
    queryParamsHandling: 'merge',
    replaceUrl: true,
  });
}
