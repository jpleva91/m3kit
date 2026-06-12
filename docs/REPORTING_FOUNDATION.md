# Reporting Foundation

How to build enterprise report pages on the `@m3kit/core` reporting
contracts — load states, typed errors, versioned query serialization, saved
views, the export baseline, temporal policy, and telemetry — and where the
kit's baseline ends and your adapters begin.

Companion to `specs/005-reporting-foundation/` (the feature that introduced
these contracts) and ADR-016 in `docs/DECISIONS.md` (the recorded
decisions). The contracts are intentionally small, pure, and copy-in friendly:
`@m3kit/core` owns serializable models and helpers; Angular wiring lives in
`@m3kit/state`; browser/router/persistence/download choices live in the demo
app as replaceable policy.

## Server-side query contract

`DataQuery` is the complete request a report view sends to a datasource:

- `filter.text?: string` — optional free-text search. In the in-memory helper
  this is a case-insensitive search across row values; a real backend should
  document which columns participate.
- `filter.fields?: Record<string, unknown>` — optional exact-match filters
  keyed by row property / backend field name. Undefined values are omitted by
  serialization.
- `sort: { key, direction } | null` — one active sort or no sort.
- `page: { index, size }` — zero-based page index and page size.

`DataPage<T>` is the complete response:

- `rows: T[]` — rows for the requested page only.
- `totalCount: number` — count of all rows matching the filter before
  pagination, so the UI can render a paginator accurately.
- `pageIndex` / `pageSize` — echo the page that produced the rows.

The datasource contract is connect-free: `TableDataSource<T>.fetch(query)` is a
request/response call that returns a cold observable, emits one `DataPage<T>`,
and completes. It has no `connect`/`disconnect` lifecycle and should retain no
view subscriptions or per-view state. Callers own reactivity (`switchMap`,
cancellation, retry, stale markers) and call `fetch` again whenever query state
changes.

A typical HTTP adapter translates without exposing backend details to the table:

```ts
fetch(query: DataQuery): Observable<DataPage<Invoice>> {
  const params = new HttpParams()
    .set('q', query.filter.text ?? '')
    .set('page', String(query.page.index))
    .set('pageSize', String(query.page.size))
    .set('sort', query.sort ? `${query.sort.key}:${query.sort.direction}` : '');

  const body = { fields: query.filter.fields ?? {} };

  return this.http.post<InvoiceApiResponse>('/api/reports/invoices/search', body, { params })
    .pipe(map((response) => ({
      rows: response.items,
      totalCount: response.total,
      pageIndex: query.page.index,
      pageSize: query.page.size,
    })));
}
```

The backend may implement the fields however it wants (SQL `WHERE`, search
service, REST query params, GraphQL variables). The boundary is that the adapter
returns the normalized `DataPage<T>` and reports failures through the observable
error channel, where `@m3kit/state` normalizes them to `ReportError`.

## Load-state taxonomy → feedback components

`LoadState<T>` is the kit-wide six-kind taxonomy. `stale` is separate from
`refreshing`: stale data is settled-but-known-outdated, while refreshing means a
new fetch is currently in flight.

| `LoadState` | Meaning | Recommended composition |
| --- | --- | --- |
| `idle` | No fetch requested yet. | Plain report frame or a quiet placeholder; do not show an error or spinner. |
| `loading` | First fetch in flight and no rows are available. | `m3k-skeleton` in the table/content region. |
| `refreshing` | Fetch in flight while previous rows stay visible. | Keep `m3k-data-table` rendered and add a progress affordance in the page toolbar/table frame. |
| `success` | Rows are available. | `m3k-data-table` with normal toolbar/filter/paginator controls. |
| `empty` | Fetch succeeded with zero rows. | `m3k-empty-state` with reset-filter or create/action affordance. |
| `error` | Fetch failed with a normalized `ReportError`; may carry last-good data. | `m3k-error-state` with retry. If `data` exists, the app may keep last-good rows visible and show the error non-destructively. |
| `success`/`empty` + `stale: true` | Settled result is valid to display but known outdated. | Add `m3k-banner` with refresh/retry affordance while keeping the settled state visible. |

The demo-hosted Storybook proof is
`apps/demo-reporting/src/app/reports/report-load-states.stories.ts`. It composes
`m3k-data-table` with `@m3kit/feedback` for all six kinds plus the stale variant.

## Saved views + URL state

There are two durable state shapes:

- `SerializedDataQuery` (`DATA_QUERY_SCHEMA_VERSION = 1`) is the deterministic
  wire/storage form of `DataQuery`. `serializeDataQuery` writes properties in a
  stable order with defaults omitted; `deserializeDataQuery` validates, migrates
  known older shapes, merges defaults, and returns `null` for garbage or future
  versions. `encodeDataQueryParam` / `decodeDataQueryParam` wrap that for a
  single router query parameter.
- `SavedView` (`SAVED_VIEW_SCHEMA_VERSION = 1`) is a named report view:
  `reportId`, `viewId`, name/description, serialized query, optional
  `ColumnViewState[]`, and ISO timestamps. `parseSavedView` validates unknown
  JSON. `applySavedView(view, definition)` is the safety gate before applying a
  view: report id must match, removed sort keys fall back to
  `definition.defaultSort ?? null`, and unknown column keys are dropped.

Pattern:

1. On page init, read the URL query parameter (the demo uses `q`) and call
   `decodeDataQueryParam`. If it returns `null`, fall back to
   `createDefaultQuery(definition.defaultPageSize)`.
2. On query changes, serialize the current query with `encodeDataQueryParam`
   and navigate with `replaceUrl: true` so typing/filtering does not flood the
   browser history.
3. When a saved view is applied, call `applySavedView` against the current
   `TableDefinition`, then update the store query and the table `columnState`
   together. Persist or share only the serialized shapes, not live store state.
4. Treat URL sync and saved-view storage as app policy. The kit ships the
   contracts and validators; consumers choose routing, persistence, permissions,
   naming, sharing, and conflict behavior.

Demo app-policy files to replace in a real application:

| File | Role | Replace with |
| --- | --- | --- |
| `apps/demo-reporting/src/app/reports/report-url-state.ts` | Owns the demo `q` query-param convention and graceful fallback. | Your router/state-sync policy and any route naming/versioning rules. |
| `apps/demo-reporting/src/app/reports/saved-views.service.ts` | In-memory saved-view registry seeded with synthetic invoice views. | Persistence adapter: REST, localStorage, IndexedDB, tenant/user-scoped backend, etc. |
| `apps/demo-reporting/src/app/reports/reports.component.*` | Wires invoices URL state, saved-view menu, column state, stale banner, and export actions. | Your report page composition and permissions. |
| `apps/demo-reporting/src/app/reports/customers-report.component.*` | Reuses URL state on a second report as a small proof. | Your additional report pages. |

## Exports

Core ships export contracts and a pure CSV/JSON baseline only.

Flow from live query to downloaded file:

1. Snapshot the live query with `serializeDataQuery(store.query())`.
2. Build an `ExportRequest`: `reportId`, `format` (`csv`/`json`), `scope`
   (`page`/`all`/`selection`), deterministic `fileBaseName`, serialized query,
   ordered visible column projection, optional selected row ids, and
   `requestedAt` as a UTC ISO instant.
3. Resolve the rows for the requested scope. `page` can use the current
   `DataPage`; `all` typically asks the datasource/backend for all filtered
   rows; `selection` filters by selected ids or calls a selection endpoint.
4. Call `createExportResult(request, rows, formattingPolicy?)`. It produces
   either a success result with filename, media type, content, and row count, or
   an error result with a normalized `ReportError`.
5. Triggering a browser download (`Blob`, object URL, hidden anchor) is app-side
   code. The demo policy lives in
   `apps/demo-reporting/src/app/reports/export-download.ts`.

Baseline behavior:

- CSV uses a header row, CRLF line breaks, RFC-4180-style quote escaping for
  cells containing quotes, commas, CR, or LF, and single-quote neutralization for
  cells beginning with `=`, `+`, `-`, or `@` to avoid spreadsheet formula
  injection.
- JSON emits the same column projection as formatted string records.
- Filenames are deterministic: `<sanitized-base>_<yyyy-mm-dd>.<format>`.
- Optional `ReportFormattingPolicy` lets date/number/currency cells format via
  `Intl`; without it, dates render as UTC ISO strings and values stringify
  plainly.

## Temporal conventions

The temporal contract is intentionally boring and backend-friendly:

- `ReportFormattingPolicy` carries the locale, IANA `timeZone`, and optional
  ISO currency code used by renderers/exports. Pass one policy object instead
  of scattering locale flags through components.
- `DateRange` values are UTC ISO instants (`start`, `end`). Do not store local
  wall-clock strings in saved views or URLs.
- Ranges are half-open `[start, end)`: `start` is inclusive and `end` is
  exclusive. Backend predicates should translate to `timestamp >= start AND
  timestamp < end`; adjacent ranges tile without gaps or double-counting.
- `resolveDateRange(key, now, timeZone)` resolves relative keys against the
  local calendar of the IANA timezone and converts the local boundaries back to
  UTC instants using `Intl` only. DST days may be 23 or 25 hours; that is the
  correct user-facing behavior.

Relative range vocabulary:

| Key | Meaning |
| --- | --- |
| `today` | Current local calendar day. |
| `yesterday` | Previous local calendar day. |
| `last7days` | Seven local calendar days ending with today. |
| `last30days` | Thirty local calendar days ending with today. |
| `thisMonth` | First day of this local month through first day of next local month. |
| `lastMonth` | First day of previous local month through first day of this local month. |
| `thisYear` | First day of this local year through first day of next local year. |

## Telemetry + redaction

`@m3kit/core` owns the pure telemetry event union and
`ReportTelemetryReporter`. `@m3kit/state` owns the Angular injection token:
`REPORT_TELEMETRY_REPORTER`, with a no-op default factory. Apps provide concrete
reporters (console, analytics SDK, OpenTelemetry/OTLP bridge, etc.) at their own
boundary; the demo's console reporter is
`apps/demo-reporting/src/app/reports/console-telemetry.ts`.

Event catalog:

| Event type | Emitted for | Sensitive-data rule |
| --- | --- | --- |
| `report.query_changed` | Filter/sort/page changed. | Carries `queryHash` only. |
| `report.fetch_started` | Datasource fetch started. | Carries `queryHash` only. |
| `report.fetch_succeeded` | Fetch returned rows. | Carries `queryHash`, `durationMs`, row count, total count. |
| `report.empty_result` | Fetch succeeded with zero rows. | Carries `queryHash` and `durationMs`. |
| `report.fetch_failed` | Fetch failed. | Carries `queryHash`, `durationMs`, `errorKind`, `retryable`; no message/details. |
| `report.export_requested` | Export action requested. | Carries format/scope only. |
| `report.export_completed` | Export content produced. | Carries format/scope/row count only. |
| `report.export_failed` | Export failed. | Carries format/scope/error kind only. |
| `report.saved_view_created` | Saved view created. | Carries `viewId` only. |
| `report.saved_view_applied` | Saved view applied. | Carries `viewId` only. |
| `report.saved_view_deleted` | Saved view deleted. | Carries `viewId` only. |

Redaction rule: telemetry identifies queries only by `queryHash` (computed by
`dataQueryHash` over the canonical serialized query). Events must never include
raw filter text, field-filter values, row data, exported content, saved-view
names, error messages, or error details. The union is shaped to enforce that;
reporter adapters must preserve it and must not enrich events with sensitive
payloads.

## Baseline vs. adapters

What the kit ships versus what consumers own.

| Capability | Baseline (in-kit) | Adapter / consumer code |
| --- | --- | --- |
| Query contract | `DataQuery`, `DataPage<T>`, `TableDataSource<T>`; connect-free `fetch(query)` semantics. | HTTP/GraphQL/search adapters, endpoint names, auth, cancellation strategy beyond unsubscribing, backend query planning. |
| Query serialization / URL payload | `SerializedDataQuery`, schema version constant, deterministic serialization, decode/encode helpers, `dataQueryHash`. | Router query-param name, history policy, route guards, share-link permissions. Demo: `report-url-state.ts`. |
| Load state / errors | `LoadState<T>`, `ReportError`, normalizer and guards; `withDataQuery` derives `loadState`. | Page-specific empty/error copy, retry UX, stale triggers, outage banners. |
| Feedback composition | Existing `@m3kit/feedback` components and taxonomy story. | Product-specific wording, support links, retry side effects. |
| Column view state | `ColumnViewState[]`, `resolveColumns`, `m3k-data-table` `columnState` input. | Column-picker UI, drag/resize interactions, user preference storage. |
| Saved views | `SavedView`, `createSavedView`, `parseSavedView`, `applySavedView`. | Persistence, sharing, ownership, naming rules, conflicts, migration of real stored records. Demo: `saved-views.service.ts`. |
| Export contracts | `ExportRequest`/`ExportResult`, CSV/JSON helpers, deterministic filenames, media types. | XLSX/PDF/print engines, server export jobs, email delivery, browser download trigger. Demo: `export-download.ts`. |
| Temporal policy | `ReportFormattingPolicy`, UTC `DateRange`, relative range resolver. | User/tenant locale selection, fiscal calendars, custom periods, backend timezone storage. |
| Telemetry | `ReportTelemetryEvent`, `ReportTelemetryReporter`, redaction shape; Angular no-op token in `@m3kit/state`. | Console/analytics/OTLP sinks, sampling, correlation, dashboards, privacy review. Demo: `console-telemetry.ts`. |
