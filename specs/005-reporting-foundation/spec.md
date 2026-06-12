# Feature Specification: Enterprise Reporting Foundation (`@m3kit/core` contracts + saved views, exports, state taxonomy)

**Feature Branch**: `005-reporting-foundation`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Implement the core enterprise-reporting parity
foundation that makes m3kit credible next to Kendo/PrimeNG/Syncfusion-style
expectations without adding UI or chart dependencies: UI-free contracts in
`libs/core` (LoadState, ReportError taxonomy, DataQuery serialization +
versioning, saved-view model, export request/result contracts,
timezone/date-range policy, telemetry event types); table/state integration
(serializable column visibility/pinning/reorder/resize model, LoadState-aware
`withDataQuery`, loading/empty/error/refreshing/stale composition with
`@m3kit/feedback`); a demo invoice/customer report demonstrating saved-view
URL state and the export request path against in-memory data only; docs,
stories, and tests per the coverage bar, with baseline-vs-adapter boundaries
documented."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consumer lifts UI-free reporting contracts that survive any rendering layer (Priority: P1)

As an enterprise consumer evaluating m3kit against commercial reporting
suites, I can lift `@m3kit/core` and get the durable reporting semantics —
explicit load states, a typed error taxonomy, versioned query
serialization, a saved-view model, export request/result contracts with a
CSV/JSON baseline, timezone/date-range policy types, and telemetry event
types — as pure TypeScript with zero Angular, Material, or vendor imports,
so my server contracts, URL state, saved views, and exports do not depend
on how (or whether) m3kit renders them.

**Why this priority**: Every other wave item consumes these contracts.
Grids, saved views, exports, and observability are the workflows users
compare against Kendo/AG Grid-class products; the contracts are the part
that must be right first and they are useful even to consumers who replace
the UI entirely (see `docs/UI_KIT_PARITY_RESEARCH.md`,
`docs/FEATURE_ARCHITECTURE_ROADMAP.md`).

**Independent Test**: Can be fully tested by Vitest specs in `libs/core`
alone — round-trip and migration of serialized queries, error
normalization, saved-view validation against a `TableDefinition`, CSV
escaping, relative date-range resolution across timezones — with no UI lib
or demo-app change.

**Acceptance Scenarios**:

1. **Given** any `DataQuery`, **When** it is serialized and deserialized
   (`serializeDataQuery` → `deserializeDataQuery`), **Then** the result is
   deep-equal to the normalized input, the serialized form carries an
   explicit schema version, and the serialization is deterministic (stable
   key order) so equal queries always produce identical text and identical
   `dataQueryHash` values.
2. **Given** a serialized query from an older schema version (fixture) or
   tampered/garbage text, **When** it is deserialized, **Then** an older
   version migrates forward through the migration hook and unusable input
   returns `null` — never a throw that breaks a page load from a shared
   URL.
3. **Given** an unknown thrown value, an `Error`, or a structured failure,
   **When** it is normalized via `toReportError`, **Then** the result is a
   `ReportError` with a `kind` from the closed taxonomy, a human-readable
   `message`, an explicit `retryable` flag, and only PII-safe `details`.
4. **Given** a `SavedView` whose query sorts on a column that no longer
   exists in the `TableDefinition`, or whose column state references
   removed columns, **When** it is applied via `applySavedView`, **Then**
   unknown column keys are dropped, the invalid sort falls back to the
   definition default, and the rest of the view still applies.
5. **Given** rows whose cell values contain commas, quotes, newlines, or
   leading `=`, `+`, `-`, `@`, **When** they are exported with the CSV
   baseline helper, **Then** the output is correctly quoted/escaped and
   formula-leading values are neutralized, and the JSON baseline produces
   the same projected rows; the `ExportResult` carries filename (per the
   deterministic filename policy), media type, and row count.
6. **Given** a relative date-range key (e.g. `last7days`, `lastMonth`) and
   an IANA timezone, **When** it is resolved at a reference instant,
   **Then** the resulting `DateRange` is a half-open `[start, end)` pair of
   UTC instants whose boundaries fall on the correct local-calendar
   boundaries for that timezone, including month-length and DST edge dates.
7. **Given** the `libs/core` source after this feature, **When** its
   imports are audited, **Then** there are no `@angular/*`, Material, CDK,
   or new third-party imports — the only external import remains the
   type-only `rxjs` `Observable` already present.

---

### User Story 2 - Table and state consume the foundation: explicit states and a serializable column model (Priority: P2)

As a consumer building report pages from the kit, my `withDataQuery` store
exposes the full load-state taxonomy (`idle`/`loading`/`success`/`empty`/
`refreshing`/`error`, plus a stale flag) and `ReportError`-typed failures,
my `m3k-data-table` applies a serializable column view state (visibility,
order, pinning, width) supplied from outside (a saved view, URL state, or
app code), and I can compose loading/empty/error/refreshing/stale renderings
from the existing `@m3kit/feedback` components — so the table behaves like
an enterprise grid's server-side mode without the kit growing UI
dependencies.

**Why this priority**: The contracts only earn parity credibility once the
shipped table and store actually speak them. This story is the integration
proof and the saved-view application point; it depends on US1 but is
independently verifiable against synthetic data with no demo-app changes.

**Independent Test**: Can be fully tested by the `libs/state` and
`libs/table` specs/stories/CTs: a store driven through fetch
success/empty/failure/refresh sequences asserting each `LoadState` kind,
and a table mounted with column view states asserting hidden/reordered/
pinned/resized columns — plus a demo-app-hosted composition story rendering
every state kind with `@m3kit/feedback` components (the story lives in the
app because lib-to-lib composition would violate module boundaries).

**Acceptance Scenarios**:

1. **Given** a `withDataQuery` store, **When** it is driven through
   connect → first fetch → result / empty result / failure → query change →
   `refresh()`, **Then** its `loadState` signal walks `idle` → `loading` →
   `success`/`empty`/`error` and re-fetches with existing rows report
   `refreshing` (previous page retained) rather than blanking back to
   `loading`; failures carry a `ReportError` (with `errorMessage` still
   available as a plain string for existing bindings).
2. **Given** a store with fetched rows, **When** `markStale()` is called,
   **Then** the data-bearing state reports stale until the next successful
   fetch clears it — giving pages a refresh-affordance hook.
3. **Given** a telemetry reporter provided through the `@m3kit/state`
   injection token, **When** the store's query changes and fetches start,
   succeed, fail, or come back empty, **Then** matching
   `ReportTelemetryEvent`s are reported carrying the report id, the query
   hash — never raw filter text — and duration/row counts; with no reporter
   provided, nothing is emitted and nothing breaks.
4. **Given** `m3k-data-table` with a `columnState` input, **When** the
   state hides a column, reorders columns, pins a column to either edge, or
   sets a width, **Then** the rendered columns reflect exactly that —
   hidden columns absent, order per the state with unlisted columns
   appended in definition order, pinned columns sticky at their edge,
   widths applied — in both controlled and uncontrolled modes, with
   `sortChange`/`pageChange`/`rowClicked` behavior unchanged.
5. **Given** the demo-app-hosted state-taxonomy story, **When** each
   `LoadState` kind is selected, **Then** the page renders the documented
   composition: `m3k-skeleton` for first load, the table plus progress for
   refreshing, `m3k-empty-state` for empty, `m3k-error-state` with a retry
   action for error, and an `m3k-banner` for stale data — all token-only,
   presentable across the 12 brands × 2 modes.

---

### User Story 3 - Demo report proves the workflow: shareable URL state, saved views, export path (Priority: P3)

As a reference consumer, I can open the demo invoices report, filter/sort/
page it, copy the URL and reload to the exact same view, switch between
seeded saved views (which also change visible/pinned columns), and export
the current query snapshot as CSV or JSON — all against in-memory synthetic
data with zero network calls — so the end-to-end reporting workflow the
contracts enable is demonstrated, copyable, and honest about where the
baseline ends and adapters begin.

**Why this priority**: The demo is living documentation; it converts the
contracts into a walkthrough consumers can lift. It depends on US1 and US2
but adds only app-layer policy (router sync, in-memory saved-view registry,
download trigger, console telemetry).

**Independent Test**: Can be fully tested by serving `demo-reporting` and
walking the invoices report (URL round-trip, saved-view switching, export
download, telemetry in the console), plus the demo-app page specs/stories
kept green. No lib changes are required by this story.

**Acceptance Scenarios**:

1. **Given** the invoices report with a text filter, a field filter, a
   sort, and a non-default page applied, **When** the URL is copied and
   opened fresh, **Then** the report restores the identical query (and
   column state when present) from the URL parameter; a tampered parameter
   degrades to the default view without errors.
2. **Given** the seeded saved views (e.g. "Overdue invoices",
   "High-value recent"), **When** one is selected from the picker, **Then**
   the query, the visible/pinned columns, and the URL all update together,
   and re-selecting the default view restores the definition's defaults.
3. **Given** the current query state, **When** CSV or JSON export is
   chosen (current page or all filtered rows), **Then** an `ExportRequest`
   snapshot is built from the live query and visible columns, the baseline
   helpers produce the file content, the browser download is triggered by
   app-layer code only, and the file's rows match what the query returns —
   verified in the page spec without any real network.
4. **Given** the demo's console telemetry reporter, **When** the user
   filters, fetches, applies a saved view, or exports, **Then** the
   corresponding `report.*` events appear with query hashes (never raw
   filter text), and the customers report demonstrates the URL-state helper
   reused on a second page.

---

### Edge Cases

- What happens when the URL query parameter is hand-edited into garbage?
  `decodeDataQueryParam` returns `null`; the page falls back to the default
  query and replaces the bad parameter on the next state change.
- What happens when a serialized query/saved view from a future (unknown,
  higher) schema version is parsed? It is rejected (`null`), never
  half-applied; the page falls back to defaults.
- What happens when a saved view's column state hides every column? The
  resolver keeps the result renderable by treating an all-hidden resolution
  as "no visible columns" — the table renders its empty-column frame and the
  picker still allows switching away; the seeded demo views never do this.
- What happens when a column is pinned at both edges in a hand-authored
  state? The resolver treats the entry's single `pinned` value as
  authoritative (the model cannot express both); duplicate keys take the
  first entry and drop the rest.
- What happens when an export is requested while the query has zero
  matching rows? A valid file with a header row (CSV) / empty array (JSON)
  is produced; row count 0 is reported in the result and telemetry.
- What happens when `refresh()` is called while in the error state? The
  store re-enters `loading` (no prior good page) or `refreshing` (prior
  good page retained) and the error clears only on success.
- What happens when fetches race (query changes mid-flight)? Unchanged
  `switchMap` semantics: the newest query wins; telemetry reports the
  superseded fetch nothing beyond its start event.
- What happens when `resolveDateRange('lastMonth', …)` runs on March 31 in
  a timezone ahead of UTC? Boundaries derive from the local calendar in the
  given IANA zone — covered by explicit DST/month-length specs.
- What happens when no telemetry reporter is provided? The token defaults
  to a no-op; stores and pages never null-check reporting call sites.
- What happens when `m3k-data-table` receives `columnState` for a
  definition that later changes? Resolution re-runs against the new
  definition; stale keys drop out, new columns append visible at the end.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `libs/core` MUST export a `LoadState<T>` discriminated union
  covering exactly `idle`, `loading`, `refreshing` (in-flight with previous
  data retained), `success` (with data and a stale flag), `empty` (with a
  stale flag), and `error` (with a `ReportError` and optional last-good
  data), plus type guards/helpers for reading data off data-bearing kinds.
- **FR-002**: `libs/core` MUST export a `ReportError` contract — closed
  `kind` taxonomy (`network`, `timeout`, `validation`, `not-found`,
  `forbidden`, `internal`, `unknown`), `message`, required `retryable`
  flag, optional `correlationId`, optional PII-safe string `details` — and
  a `toReportError(unknown)` normalizer that never throws.
- **FR-003**: `libs/core` MUST export versioned `DataQuery` serialization:
  a `SerializedDataQuery` envelope with an explicit schema version
  constant, `serializeDataQuery` producing deterministic, minimal output
  (defaults omitted, stable key order), and `deserializeDataQuery`
  validating shape, merging defaults, migrating older versions through an
  explicit migration step, and returning `null` for unusable or
  future-version input.
- **FR-004**: `libs/core` MUST export URL-safe helpers
  `encodeDataQueryParam`/`decodeDataQueryParam` that round-trip a
  `DataQuery` through a single string suitable for a router query
  parameter, with decode failures returning `null`.
- **FR-005**: `libs/core` MUST export `dataQueryHash(query)` — a stable,
  pure hash over the serialized query (identical queries → identical hash)
  suitable for cache keys and telemetry, with no crypto/vendor dependency.
- **FR-006**: `libs/core` MUST export a serializable column view-state
  model — `ColumnViewState { key; visible?; pinned?: 'start' | 'end';
  width? }` with array order as display order — and a pure
  `resolveColumns(definitionColumns, state)` helper implementing the
  resolution rules (unknown keys dropped, duplicates first-wins, unlisted
  columns appended in definition order, hidden columns removed).
- **FR-007**: `libs/core` MUST export a versioned `SavedView` model
  (version, `reportId`, `viewId`, `name`, optional `description`,
  serialized query, optional column view state, created/updated ISO
  timestamps) plus `createSavedView`, a validating `parseSavedView(unknown)
  → SavedView | null` with a migration step, and `applySavedView(view,
  definition)` that validates against the `TableDefinition` (report id
  match, sort-key fallback, unknown-column drop) before returning the
  query + column state to apply.
- **FR-008**: `libs/core` MUST export export contracts: `ExportFormat`
  (baseline union `'csv' | 'json'`), `ExportColumn` projection (key,
  header, optional type), `ExportScope` (`'page' | 'all' | 'selection'`),
  `ExportRequest` (report id, format, scope, file base name, serialized
  query snapshot, column projection, optional selected row ids, requested
  timestamp), and a discriminated `ExportResult` (success with filename,
  media type, content text, row count | error with `ReportError`).
- **FR-009**: `libs/core` MUST provide pure baseline export helpers:
  row flattening over an `ExportColumn` projection with optional
  `ReportFormattingPolicy`-aware value formatting, `rowsToCsv` (header row,
  RFC-4180-style quoting of delimiters/quotes/newlines, neutralization of
  formula-leading `=`/`+`/`-`/`@` values), `rowsToJson` (same projection),
  and a deterministic, filesystem-safe filename builder. Core MUST NOT
  contain browser download, Blob/anchor, or PDF/XLSX rendering code.
- **FR-010**: `libs/core` MUST export temporal policy contracts: a
  `ReportFormattingPolicy` (locale, IANA timezone, optional currency code),
  a `DateRange` of UTC ISO instants with documented half-open
  `[start, end)` semantics as the kit-wide convention, a closed
  `RelativeDateRangeKey` union (`today`, `yesterday`, `last7days`,
  `last30days`, `thisMonth`, `lastMonth`, `thisYear`), and a pure,
  timezone-correct `resolveDateRange(key, now, timeZone)` implemented with
  `Intl` only.
- **FR-011**: `libs/core` MUST export a `ReportTelemetryEvent`
  discriminated union covering at minimum `report.query_changed`,
  `report.fetch_started`, `report.fetch_succeeded`, `report.fetch_failed`,
  `report.empty_result`, `report.export_requested`,
  `report.export_completed`, `report.export_failed`,
  `report.saved_view_created`, `report.saved_view_applied`, and
  `report.saved_view_deleted`, plus a `ReportTelemetryReporter` interface.
  Events MUST identify queries by `dataQueryHash` and MUST NOT carry raw
  filter text or row data (redaction rule documented on the types).
- **FR-012**: All US1 additions land in `libs/core` as pure TypeScript:
  no `@angular/*`, Material/CDK, or new third-party imports (the existing
  type-only `rxjs` import is the permitted ceiling); no runtime dependency
  additions anywhere in this feature.
- **FR-013**: `withDataQuery` in `libs/state` MUST expose the foundation:
  a `loadState` computed deriving the FR-001 taxonomy from the fetch
  lifecycle (first load vs. refresh-with-data distinguished), errors stored
  as `ReportError | null` with an `errorMessage` string computed kept for
  existing controlled-table bindings, a `markStale()` method whose flag
  clears on the next successful fetch, an optional `reportId` option, and
  telemetry emission (query-changed/fetch lifecycle/empty-result) through
  an optional `@m3kit/state` injection token that defaults to a no-op.
  In-repo consumers (demo pages, stories) MUST be updated in the same
  change.
- **FR-014**: `m3k-data-table` MUST accept an optional `columnState` input
  (`readonly ColumnViewState[]`) and render columns through FR-006's
  resolver — visibility, order, pinning (sticky at the pinned edge), and
  width — in both controlled and uncontrolled modes, leaving the
  outputs and query/fetch behavior unchanged. Interactive
  reorder/resize/visibility chrome is explicitly NOT part of this feature.
- **FR-015**: The loading/empty/error/refreshing/stale taxonomy MUST be
  demonstrated as a composition of `m3k-data-table` with the existing
  `@m3kit/feedback` components (`skeleton`, `empty-state`, `error-state`,
  `banner`), authored as a story hosted in `apps/demo-reporting` (the app
  is the only project allowed to compose both libs) and documented as the
  recommended page pattern.
- **FR-016**: The demo invoices report MUST demonstrate the full workflow
  with in-memory data only: query (and applied column state) synchronized
  to a URL query parameter via FR-004 (restore on load, replace on change,
  graceful fallback on bad input); an in-memory saved-view registry seeded
  with at least two views whose application goes through `applySavedView`;
  an export menu (CSV/JSON × current page/all filtered rows) building an
  `ExportRequest` from the live query and visible columns, generating
  content via FR-009 helpers, and triggering the download in app code; and
  a provided console `ReportTelemetryReporter`. The customers report MUST
  reuse the URL-state helper to prove it generalizes.
- **FR-017**: Documentation MUST be added/updated in the same change:
  a new `docs/REPORTING_FOUNDATION.md` covering the server-side query
  contract (how `DataQuery`/`DataPage` map to a real backend, with a
  translation example), the state-taxonomy-to-feedback-component mapping,
  the saved-view + URL-state pattern, temporal conventions, the telemetry
  redaction rule, and an explicit baseline-vs-adapter boundary table
  (CSV/JSON + contracts = baseline; XLSX/PDF/server export jobs,
  persistence backends, telemetry sinks = adapters/consumer code);
  AGENTS.md component/contract inventory and README repo map updated; an
  ADR recording the foundation decisions in `docs/DECISIONS.md`; any
  external consultation logged in `docs/BOUNDARY_LOG.md` at the time it
  happens (the default is consulting nothing external).
- **FR-018**: The coverage bar holds: every touched exported component
  keeps/extends its three artifacts (`*.spec.ts`, `*.stories.ts`,
  `*.cy.ts`); all new core/state modules ship Vitest specs beside them;
  demo-app pages keep their spec + story coverage; the full gate passes
  (`npx nx run-many -t lint test build`, component tests across CT libs,
  clean `m3kit-table:build-storybook`).

### Key Entities

- **LoadState\<T\>**: discriminated union of the six explicit fetch states;
  data-bearing kinds carry the page and a stale flag.
- **ReportError**: normalized failure — closed `kind` taxonomy, message,
  `retryable`, optional correlation id and PII-safe details.
- **SerializedDataQuery**: versioned, deterministic wire/storage form of
  `DataQuery`; the unit of URL state, saved views, export snapshots, and
  hashing.
- **ColumnViewState**: one serializable column adjustment —
  `{ key, visible?, pinned?, width? }`; array order is display order.
- **SavedView**: versioned named view — report id, view id, name, serialized
  query, optional column state, timestamps; persistence is not core.
- **ExportRequest / ExportResult**: snapshot of what to export (format,
  scope, query, column projection) and the discriminated outcome (content +
  filename + media type + row count, or `ReportError`).
- **DateRange / RelativeDateRangeKey / ReportFormattingPolicy**: UTC-instant
  half-open ranges, the closed relative-range vocabulary, and the
  locale/timezone/currency policy components and exports format against.
- **ReportTelemetryEvent / ReportTelemetryReporter**: the closed
  observability event union (query-hash-identified, redacted by
  construction) and the sink interface adapters implement.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Query serialization round-trips losslessly (deserialize ∘
  serialize = normalize) for representative queries, migrates a recorded
  v-older fixture forward, and rejects garbage/future versions as `null` —
  all proven by `libs/core` specs; equal queries hash identically.
- **SC-002**: A saved view applied on the demo invoices report updates the
  fetched rows, the visible/pinned columns, and the URL together, and
  opening that URL fresh reproduces the identical view — proven by the page
  spec plus a serve-and-walk check.
- **SC-003**: CSV exports of cells containing delimiters, quotes, newlines,
  and formula-leading characters re-import correctly (escaping specs) with
  formula injection neutralized; JSON exports carry the same projected
  rows; zero-row exports produce valid output; filenames are deterministic.
- **SC-004**: All six `LoadState` kinds are observable from a
  `withDataQuery` store under simulated success/empty/failure/refresh
  sequences (state specs), and all six are rendered by the demo-hosted
  composition story using `@m3kit/feedback` components.
- **SC-005**: 100% of column view-state capabilities (hide, reorder, pin
  start/end, width) are asserted in the table's spec/story/CT, with
  controlled-mode events unchanged.
- **SC-006**: `libs/core` remains dependency-free: an import audit finds
  no `@angular/*`/Material/CDK/vendor imports and `package.json` gains no
  dependencies; module boundaries are unchanged and the full gate —
  `npx nx run-many -t lint test build`, `component-test` across CT libs,
  and `npx nx run m3kit-table:build-storybook` — passes.
- **SC-007**: Telemetry events asserted in specs carry query hashes and
  never raw filter text; `docs/REPORTING_FOUNDATION.md` ships the
  baseline-vs-adapter boundary table and the server-side contract example;
  AGENTS.md/README/ADR are truthful in the same change.

## Out of Scope

- **Export rendering engines** — no PDF, XLSX, or print pipelines and no
  server export-job client. The contract + CSV/JSON baseline is the
  deliverable; richer formats are documented adapter paths.
- **Persistence adapters** — no localStorage/REST/IndexedDB saved-view
  persistence; the demo registry is in-memory and the contracts are the
  deliverable. Decided 2026-06-12: in-memory only for this feature; a
  demo localStorage adapter is a candidate follow-up.
- **Interactive column chrome** — no drag-to-reorder, resize grips, or
  column-picker UI; this feature ships the serializable model and the
  table's ability to render it. Decided 2026-06-12: model-only in this
  feature; a minimal `m3k-column-picker` menu component goes to the next
  wave.
- **Density in saved views** — `m3k-data-table` exposes no density input
  today, so `SavedView` carries no density field. Decided 2026-06-12:
  omitted from the v1 schema; added via a v2 migration when a density
  input exists (the migration hook exists for exactly this).
- **Operator-rich filter model** — filter operators beyond the current
  text + exact-match field contract (ranges, contains, in-list, relative
  dates wired into `FilterState`) are a future feature; the temporal types
  ship now so that feature has a foundation.
- **Virtualization, grouping/aggregation, pivot, geospatial contracts** —
  separate roadmap phases (`docs/FEATURE_ARCHITECTURE_ROADMAP.md`).
- **Real network, backends, auth** — constitution Principle V; the
  server-side contract is demonstrated against `InMemoryTableDataSource`
  and documented prose only.
- **E2E testing, CI provider config, publishing** — unchanged standing
  deferrals.

## Assumptions

- The existing `DataQuery`/`DataPage`/`TableDataSource` contracts in
  `libs/core` are the serialization subject as-is; this feature versions
  and wraps them without breaking their shape.
- `InMemoryTableDataSource` (with its existing `latencyMs` option) is
  sufficient for all demo/story needs; failure scenarios are simulated with
  inline stub datasources in specs/stories, not new core options.
- The cross-lib state-taxonomy composition lives in `apps/demo-reporting`
  because module boundaries forbid `table` ↔ `feedback` imports; this is a
  deliberate consequence of the boundary rules, not a workaround.
- `withDataQuery`'s public methods and the controlled-table input/output
  contract stay backward compatible except the documented `error` →
  `ReportError | null` type change, whose in-repo consumers are migrated in
  the same change.
- Generic enterprise reporting patterns (saved views, CSV escaping rules,
  URL-shareable state, telemetry event naming) are public knowledge per the
  constitution; the intent is to consult nothing external for this feature,
  and any consultation that does happen is logged in
  `docs/BOUNDARY_LOG.md` at the time it happens.
- DESIGN.md remains binding for the demo's picker/menu/banner visuals; this
  feature adds no new visual language, only compositions of existing
  components.
- The constitution (clean-room integrity, pinned stack, synthetic data,
  boundary-log duties, simplicity bias) governs this feature as ratified.
