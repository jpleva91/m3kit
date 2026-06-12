# Implementation Plan: Enterprise Reporting Foundation

**Branch**: `005-reporting-foundation` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-reporting-foundation/spec.md`

## Summary

Land the UI-free enterprise-reporting contracts in `libs/core` —
`LoadState<T>`, the `ReportError` taxonomy, versioned `DataQuery`
serialization (+ URL param helpers + stable hash), the column view-state
model, the versioned `SavedView` model, export request/result contracts
with pure CSV/JSON baseline helpers, temporal policy types with
timezone-correct relative-range resolution, and the
`ReportTelemetryEvent` union — then make the shipped state and table speak
them (`withDataQuery` load-state/stale/telemetry, `m3k-data-table`
`columnState`), and prove the workflow on the demo invoices report
(URL-shareable query state, seeded saved views, CSV/JSON export path,
console telemetry; customers report reuses the URL helper). Exit criterion:
full gate green, core still Angular-free with zero new dependencies, docs
truthful (`docs/REPORTING_FOUNDATION.md`, AGENTS.md inventory, ADR).

## Technical Context

**Language/Version**: TypeScript 5.7.x (pinned stack); Node.js 24

**Primary Dependencies**: none added. `libs/core` stays pure TypeScript
(existing type-only `rxjs` import is the ceiling); `libs/state` already uses
`@angular/core` + `@ngrx/signals`; `libs/table` already uses Angular
Material table/sort/paginator. Temporal resolution uses `Intl` built-ins
only; hashing is a tiny pure FNV-1a — **no crypto, date, or CSV libraries.**

**Storage**: N/A — saved views are contracts + an in-memory demo registry;
URL state lives in router query params; exports are in-memory strings until
the app-layer download trigger.

**Testing**: Vitest via `@nx/vite:test` for all new core/state modules and
updated components; Cypress CT via the existing `component-test` targets
(`m3kit-table` for the data-table changes); Storybook stories collected by
the single host at `libs/table/.storybook/main.ts` (globs already cover
table, state, feedback, and the demo app — no glob changes needed).

**Target Platform**: Modern evergreen browsers; verified on Linux with pnpm

**Project Type**: Nx monorepo — additions inside existing libs
(`core`, `state`, `table`) + demo-app feature work; no new projects

**Performance Goals**: N/A beyond no regression — serialization/resolution
helpers are O(columns + filters) pure functions; the table's column
resolution is one `computed`

**Constraints**: Core stays UI-free (no `@angular/*` imports); token-only
styling for anything visual; module boundaries unchanged (`state → core`,
`table → core, theme`, app → all); DESIGN.md binding; synthetic data only
(invoices/customers from `libs/testing`); clean-room logging in
`docs/BOUNDARY_LOG.md` (target: zero external consultations)

**Scale/Scope**: ~8 new core modules + specs, 2 state-lib changes + token,
1 table component extension (3 artifacts updated), 1 demo-hosted
composition story, invoices-page workflow (URL/saved-views/export/
telemetry) + customers-page reuse, 1 new doc + AGENTS/README/ADR updates

## Constitution Check

*GATE: Must pass before implementation. Re-check at completion.*

| Principle | Gate | Status |
|---|---|---|
| I. Clean-Room Integrity | Saved views, CSV escaping, URL state, telemetry naming are generic public reporting knowledge (explicitly permitted); plan is to consult nothing external — any consultation that happens is logged in `docs/BOUNDARY_LOG.md` at the time. No private sources, no real data. | PASS |
| II. Source-Internalization First | Everything lands in existing liftable libs as plain, readable contracts + pure helpers; no new projects, executors, or build steps; `docs/REPORTING_FOUNDATION.md` tells adopters what is baseline vs. what they replace. | PASS |
| III. Pinned-Stack Discipline | Zero dependency or version changes; `Intl` and hand-rolled FNV-1a instead of date/crypto/CSV packages. | PASS |
| IV. Phasing and Review Gates | Scoped to contracts + integration + demo proof; export engines, persistence adapters, interactive column chrome, operator filters all explicitly deferred. | PASS |
| V. Synthetic Data Only | Demo/spec/story data from `libs/testing` factories (invoices, customers); saved-view fixtures authored here over those domains; no backends — `InMemoryTableDataSource` only. | PASS |
| VI. Boundary-Log Duties | ADR in `docs/DECISIONS.md` for the foundation (versioning scheme, baseline-vs-adapter policy, column-state model, telemetry redaction); docs updated in the same change; boundary log appended only if a consultation actually happens. | PASS |
| VII. Simplicity Bias | Contracts are types + pure functions, no abstraction layers; one schema version constant + one migration hook (no migration framework); telemetry is a union + one interface; the table gains one input, not a column-management subsystem. | PASS |

No violations; the Complexity Tracking section is empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-reporting-foundation/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
└── tasks.md             # Phase output (/speckit-tasks command)
```

### Source Code (repository root)

```text
libs/core/src/lib/                      # US1 — all pure TS, spec beside each module
├── report-error.ts{,.spec.ts}          # ReportError, ReportErrorKind, toReportError
├── load-state.ts{,.spec.ts}            # LoadState<T> union + guards/helpers
├── temporal.ts{,.spec.ts}              # ReportFormattingPolicy, DateRange, resolveDateRange
├── query-serialization.ts{,.spec.ts}   # SerializedDataQuery, (de)serialize, encode/decode param, dataQueryHash
├── column-state.ts{,.spec.ts}          # ColumnViewState, resolveColumns
├── saved-view.ts{,.spec.ts}            # SavedView, createSavedView, parseSavedView, applySavedView
├── export.ts{,.spec.ts}                # ExportRequest/Result, rowsToCsv/rowsToJson, filename builder
├── telemetry.ts{,.spec.ts}             # ReportTelemetryEvent union, ReportTelemetryReporter
└── (src/index.ts barrel gains the new exports)

libs/state/src/lib/                     # US2 — store speaks the foundation
├── with-data-query.ts{,.spec.ts}       # loadState computed, ReportError error, markStale, telemetry emission
└── telemetry-token.ts{,.spec.ts}       # REPORT_TELEMETRY_REPORTER InjectionToken (no-op default)

libs/table/src/lib/                     # US2 — table renders column view state
└── data-table.component.{ts,html,scss,spec.ts,stories.ts,cy.ts}   # + columnState input (artifacts extended)

apps/demo-reporting/src/app/reports/    # US2 story host + US3 workflow
├── report-load-states.stories.ts       # taxonomy composition: data-table × @m3kit/feedback
├── report-url-state.ts{,.spec.ts}      # router ⇄ encodeDataQueryParam sync helper (app policy)
├── saved-views.service.ts{,.spec.ts}   # in-memory registry seeded with invoice views
├── export-download.ts{,.spec.ts}       # Blob/anchor download trigger (app side, not core)
├── console-telemetry.ts{,.spec.ts}     # console ReportTelemetryReporter
├── reports.component.{ts,html,scss,spec.ts,stories.ts}   # invoices page: URL + saved views + export menu
└── customers-report.component.*        # reuses report-url-state helper

apps/demo-reporting/src/app/app.config.ts   # provides REPORT_TELEMETRY_REPORTER → console reporter
docs/REPORTING_FOUNDATION.md            # NEW: server contract, state mapping, baseline-vs-adapter table
AGENTS.md / README.md / docs/DECISIONS.md   # inventory, repo map, ADR
```

**Structure Decision**: No new Nx projects and no boundary changes — the
foundation is `libs/core` modules following the existing one-module-one-spec
pattern (`query.ts`/`query.spec.ts`); integrations land inside the libs that
already own the behavior; everything app-policy (router sync, persistence
registry, download trigger, telemetry sink) lands in the demo app and is
documented as the part consumers replace.

### Module Boundaries

**No `eslint.config.mjs` changes.** Every edge this feature uses already
exists: `state → core`, `table → core (+ theme)`, `demo-reporting → all`.
Two boundary consequences are design inputs, not workarounds:

- The state-taxonomy composition story (`m3k-data-table` ×
  `@m3kit/feedback`) MUST live in `apps/demo-reporting` — `table` and
  `feedback` may not import each other, and the Storybook host already
  globs the app.
- The telemetry `InjectionToken` lives in `libs/state`, not `libs/core`,
  because core is Angular-free; core owns only the pure
  `ReportTelemetryReporter` interface and event union.

Verification: the existing boundary proof regime stands; this feature adds
an import audit to the core specs/tasks (`grep -r "@angular" libs/core/src`
returns nothing) instead of new lint rules.

### API Design (key decisions)

**`LoadState<T>`** (core) — discriminated union, `kind`-keyed:

```ts
type LoadState<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }                                  // first load, nothing to show
  | { kind: 'refreshing'; data: T }                      // in flight, previous data retained
  | { kind: 'success'; data: T; stale: boolean }
  | { kind: 'empty'; stale: boolean }
  | { kind: 'error'; error: ReportError; data?: T };     // data = last good page, if any
```

Plus `loadStateData(state): T | undefined` and per-kind guards. `stale` is a
flag on data-bearing kinds (data is valid but known-outdated), distinct from
`refreshing` (a fetch is actually in flight).

**`ReportError`** (core) — `{ kind: ReportErrorKind; message: string;
retryable: boolean; correlationId?: string; details?:
Readonly<Record<string, string>> }` with kinds `'network' | 'timeout' |
'validation' | 'not-found' | 'forbidden' | 'internal' | 'unknown'`.
`toReportError(error, fallbackKind = 'unknown')` normalizes `Error`/string/
unknown and passes through values that already satisfy the shape. `details`
is documented PII-safe-only; the demo never populates it with row data.

**Query serialization** (core) — `DATA_QUERY_SCHEMA_VERSION = 1`;
`SerializedDataQuery = { v: number; text?: string; fields?: Record<string,
unknown>; sort?: { key: string; dir: SortDirection }; page: { index: number;
size: number } }` — flat, minimal (empty filter/null sort omitted), built
with explicit property order so `JSON.stringify` is deterministic.
`deserializeDataQuery(input: unknown): DataQuery | null` validates field
types, merges `createDefaultQuery()` defaults, routes `v <
DATA_QUERY_SCHEMA_VERSION` through a single `migrateSerializedQuery` switch
(v1 is current, so the switch starts empty but is spec-fixtured), and
returns `null` for garbage or `v >` current. `encodeDataQueryParam` /
`decodeDataQueryParam` wrap compact JSON for a single router query param
(the router percent-encodes; the value stays human-debuggable).
`dataQueryHash` = FNV-1a 32-bit over the canonical serialized JSON,
returned as fixed-width hex.

**Column view state** (core) — `ColumnViewState { key: string; visible?:
boolean /* default true */; pinned?: 'start' | 'end'; width?: string }`;
array order = display order. `resolveColumns<T>(columns: readonly
ColumnDef<T>[], state?: readonly ColumnViewState[]): readonly
ResolvedColumn<T>[]` where `ResolvedColumn<T> = { def: ColumnDef<T>;
pinned?: 'start' | 'end'; width?: string }` (state width overrides
definition width). Rules: unknown keys dropped, duplicate keys first-wins,
unlisted definition columns appended visible in definition order,
`visible: false` removed. Headless by design — interactive chrome is a
future feature; saved views and app code are the writers.

**`SavedView`** (core) — `SAVED_VIEW_SCHEMA_VERSION = 1`; `{ version;
reportId; viewId; name; description?; query: SerializedDataQuery; columns?:
readonly ColumnViewState[]; createdAt; updatedAt }` (ISO strings).
`createSavedView` stamps version + timestamps; `parseSavedView(unknown)`
validates + migrates like queries do; `applySavedView(view, definition)`
returns `{ query: DataQuery; columns?: readonly ColumnViewState[] } | null`
— `null` on report-id mismatch; sort keys absent from the definition fall
back to `definition.defaultSort ?? null`; column entries with unknown keys
drop. No density field in v1 (no table density input exists; the migration
hook is the upgrade path — see the decided scope notes in spec.md Out of Scope).

**Export contracts** (core) — `ExportFormat = 'csv' | 'json'`;
`ExportScope = 'page' | 'all' | 'selection'`; `ExportColumn = { key;
header; type?: ColumnType }`; `ExportRequest = { reportId; format; scope;
fileBaseName; query: SerializedDataQuery; columns: readonly ExportColumn[];
rowIds?: readonly string[]; requestedAt: string }`; `ExportResult =
{ kind: 'success'; request; filename; mediaType; content: string;
rowCount } | { kind: 'error'; request; error: ReportError }`. Helpers:
`flattenRows(rows, columns, policy?)` (policy-aware `Intl` formatting for
date/number/currency types, plain stringification otherwise),
`rowsToCsv(rows, columns, policy?)` (header row from `header`s; quote any
cell containing `"`, `,`, `\r`, `\n`; double embedded quotes; prefix `'` to
cells starting with `=`, `+`, `-`, `@` — formula-injection neutralization),
`rowsToJson(rows, columns)` (array of key→formatted-value records),
`buildExportFilename(baseName, format, timestamp)` →
`invoices_2026-06-12.csv`-style, lowercase, `[a-z0-9-_]` sanitized,
deterministic. `createExportResult(request, rows, policy?)` ties them
together so callers hold one entry point. Browser download stays app-side
(`export-download.ts` in the demo).

**Temporal policy** (core) — `ReportFormattingPolicy { locale: string;
timeZone: string; currencyCode?: string }`; `DateRange { start: string;
end: string }` (UTC ISO instants, half-open `[start, end)` — documented as
the kit-wide convention for backend-friendly range filters);
`RelativeDateRangeKey = 'today' | 'yesterday' | 'last7days' | 'last30days'
| 'thisMonth' | 'lastMonth' | 'thisYear'`; `resolveDateRange(key, now,
timeZone)` computes local-calendar boundaries via
`Intl.DateTimeFormat(…, { timeZone })` part extraction — no date library.
Specs pin DST transitions, month-length edges (Jan 31 → `lastMonth`), and
zones ahead/behind UTC.

**Telemetry** (core types, state wiring) — `ReportTelemetryEvent`: common
fields `{ type; reportId; at: string; correlationId? }` with per-type
payloads (`query_changed { queryHash }`, `fetch_succeeded { queryHash;
durationMs; rowCount; totalCount }`, `fetch_failed { queryHash; durationMs;
errorKind; retryable }`, `empty_result { queryHash }`, `export_requested /
export_completed / export_failed { format; scope; rowCount?; errorKind? }`,
`saved_view_created / applied / deleted { viewId }`). Doc comments carry the
redaction rule: query identity is always `dataQueryHash`, never raw filter
text; no row data in events. `ReportTelemetryReporter { report(event):
void }`. In `libs/state`, `REPORT_TELEMETRY_REPORTER =
new InjectionToken<ReportTelemetryReporter>(…, { factory: () => NOOP })` so
injection sites never null-check.

**`withDataQuery` changes** (state) — state gains `hasFetched: boolean` and
`stale: boolean`; `error` becomes `ReportError | null` (stored via
`toReportError`); new computeds `errorMessage: string | null` (keeps the
existing controlled-table binding working) and `loadState:
Signal<LoadState<DataPage<T>>>` derived as: no fetch yet + not loading →
`idle`; loading with no prior rows → `loading`; loading with prior rows →
`refreshing`; error → `error` (carrying last good page when one exists);
success with 0 rows → `empty`; otherwise `success`; `stale` flag forwarded
onto data-bearing kinds. New `markStale()` method; the flag clears on the
next successful fetch. `WithDataQueryOptions` gains `reportId?: string`;
the rxMethod pipeline reports `fetch_started/succeeded/failed/empty_result`
(duration via `Date.now()` deltas) and `applyQuery` reports
`query_changed` through the injected reporter. Public method signatures are
otherwise unchanged; in-repo consumers re-point `store.error()` bindings to
`store.errorMessage()`.

**`m3k-data-table` changes** (table) — new input `columnState =
input<readonly ColumnViewState[] | undefined>(undefined)`; the `columns`
computed becomes `resolveColumns(definition().columns, columnState())` and
the template binds per-column `sticky` / `stickyEnd` from the resolution
(Material's native sticky-column support; the existing width binding reads
the resolved width). `displayedColumns` derives from resolved columns, so
hide/reorder falls out for free in both modes. No new outputs — the state
is externally owned (saved views/URL/app code write it), keeping the
component controlled-friendly and the interactive chrome honestly out of
scope.

**Demo workflow** (app policy, the part consumers replace) —
`report-url-state.ts`: a small helper owning the `q` query-param contract
(read+decode on init, `router.navigate` with `replaceUrl: true` on query
change, optional `view`/`cols` handling for applied views); used by both
report pages. `saved-views.service.ts`: in-memory registry seeded with two
authored `SavedView` fixtures over the invoices definition (e.g.
"Overdue invoices" — status filter + dueAt sort + pinned amount;
"High-value recent" — amount sort + hidden columns); exposes
`views()`/`create()`/`delete()` signals and reports `saved_view_*`
telemetry. Invoices page: picker via the existing page-toolbar action slot
+ `MatMenu` (precedent: app brand switcher), export menu (CSV/JSON × page/
all) building `ExportRequest` from the live store query + resolved visible
columns, `createExportResult` + `export-download.ts` Blob/anchor trigger,
`stale` banner + refresh affordance. `console-telemetry.ts` provided in
`app.config.ts` against `REPORT_TELEMETRY_REPORTER`.

### Tooling / Wiring Decisions

- **Storybook**: no host config changes — `libs/table/.storybook/main.ts`
  already globs table, state, feedback, and the demo app. New stories:
  table column-state story (beside the component) and the demo-hosted
  `report-load-states.stories.ts`.
- **Cypress CT**: extend `data-table.component.cy.ts` on the existing
  `m3kit-table` `component-test` target (hidden/reordered/pinned/width
  assertions; pinned = sticky position checks while horizontally
  scrolled).
- **Vitest**: every new core/state module ships its spec beside it
  (`npx nx test m3kit-core`, `npx nx test m3kit-state`); demo helpers and
  pages keep `npx nx test demo-reporting` green (router-stubbed page specs
  for URL sync, JSDOM-safe download trigger spec via injected document
  hooks).
- **Coverage bar**: applies to touched exported *components*
  (`data-table` keeps spec/story/cy); core/state are non-component libs —
  their bar is specs beside modules, matching existing practice.
- **Gate commands** (from AGENTS.md, verbatim):
  `npx nx run-many -t lint test build`, `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox
  npx nx run-many -t component-test`, `npx nx run m3kit-table:build-storybook`.

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Contract churn — shipping v1 shapes that need breaking changes next wave (density, operators). | Every serialized artifact carries a schema version and a single migration hook from day one; deferred fields are listed in the spec's clarification markers, not silently added. |
| Core scope creep — "helpful" Angular/browser conveniences leaking into `libs/core`. | FR-012 import audit task (`grep -r "@angular" libs/core/src` empty) + review checklist; download/DI/router code has named app-side homes in the plan. |
| `error` type change breaking controlled-table consumers. | `errorMessage` computed preserves the string binding; the only in-repo consumers (two demo pages, one app story) are migrated in the same tasks; the change is called out in the ADR. |
| Sticky-column styling drift across 12 brands (pinned columns gain surfaces/borders). | Token-only treatment (`--mat-sys-surface*`, `outline-variant` divider); parity check via the table story under the Storybook brand toolbar; no per-brand selectors. |
| CSV correctness edge cases (locale decimal commas colliding with delimiters, formula injection). | Policy-aware formatting is applied before quoting, so quoting covers locale output too; escaping + injection rules are FR-level with dedicated specs (SC-003). |
| Timezone math bugs in `resolveDateRange` without a date library. | Closed 7-key vocabulary keeps the surface small; specs pin DST-transition dates, month-length edges, and ±UTC zones; anything fancier is deferred to the operator-filter feature. |
| URL param bloat / unreadable links. | Compact JSON with defaults omitted; only non-default state serializes; decode failures degrade to defaults (spec edge case). |
| Demo page complexity obscuring the lesson. | URL sync, saved views, export download, and telemetry each live in their own small app-side file with a doc section mapping file → "replace this with your own X". |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations — nothing to track.
