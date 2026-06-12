---

description: "Task list for the enterprise reporting foundation (core contracts, saved views, exports, state taxonomy)"
---

# Tasks: Enterprise Reporting Foundation

**Input**: Design documents from `/specs/005-reporting-foundation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Vitest specs beside every new core/state module; the full coverage bar (`*.spec.ts` + `*.stories.ts` + `*.cy.ts`) for the touched `data-table` component; demo-app page specs/stories kept green. No e2e.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story, and rolled up into three execution batches sized for parallel agent work (see Agent Execution Batches).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Core contracts: `libs/core/src/lib/` (project `m3kit-core`, alias `@m3kit/core` — pure TS, no `@angular/*` imports)
- Store features: `libs/state/src/lib/` (project `m3kit-state`, alias `@m3kit/state` — may depend on core only)
- Table: `libs/table/src/lib/` (project `m3kit-table` — may depend on core + theme)
- Demo app: `apps/demo-reporting/src/app/` (project `demo-reporting` — may depend on everything; hosts all cross-lib compositions)
- Gate commands (AGENTS.md, verbatim): `npx nx run-many -t lint test build` · `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run-many -t component-test` · `npx nx run m3kit-table:build-storybook`

## Agent Execution Batches

Three dependency-ordered batches; tasks inside a batch marked [P] can be farmed out to parallel agents, unmarked tasks are sequential within their phase.

- **Batch 1 — Foundation (Phases 1–2)**: docs scaffolding + all `libs/core` contract modules. After T004, the six contract modules (T005–T010) are parallelizable across agents (independent files); T011 (barrel + audits) is the serialization point and must run last.
- **Batch 2 — Integration (Phase 3)**: `libs/state` and `libs/table` tracks are independent of each other and can run as two parallel agents (T012–T013 vs. T014–T015); the demo-hosted taxonomy story (T016) joins the tracks and runs last.
- **Batch 3 — Demo + Polish (Phases 4–5)**: app-side helper files (T017, T018, T019 in part) are parallelizable; the invoices-page assembly (T020–T021) is sequential on them; docs (T023–T024) can overlap the late demo tasks; the full gate (T025) is strictly last.

Do not start Batch 2 before T011 is merged, or Batch 3 before T012–T016 are merged — the contracts and store/table surfaces are imports everywhere downstream.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Record the decisions and create the doc landing zone before contract code exists

- [ ] T001 Add the foundation ADR to `docs/DECISIONS.md`: schema-versioning scheme (version constant + single migration hook for queries and saved views), the baseline-vs-adapter boundary policy (CSV/JSON + contracts baseline; XLSX/PDF/server jobs/persistence/telemetry sinks = adapter/consumer code), the headless column view-state model (no interactive chrome this wave), the telemetry redaction rule (query hash, never raw filter text), and the `withDataQuery` `error: ReportError | null` type change
- [ ] T002 [P] Scaffold `docs/REPORTING_FOUNDATION.md` with the section skeleton from plan.md (server-side query contract, state-taxonomy mapping, saved views + URL state, exports, temporal conventions, telemetry + redaction, baseline-vs-adapter table) so later tasks fill sections instead of inventing structure

---

## Phase 2: Foundational — User Story 1, core contracts (Priority: P1) 🎯 MVP

**Goal**: All reporting contracts land in `libs/core` as pure TypeScript with specs beside them; `@m3kit/core` consumers can type against the entire foundation

**Independent Test**: `npx nx test m3kit-core && npx nx lint m3kit-core` green; `grep -rE "@angular|@ngrx" libs/core/src` returns nothing

**⚠️ CRITICAL**: No user story 2/3 work can begin until this phase is complete

- [ ] T003 [US1] Create `libs/core/src/lib/report-error.ts` + `report-error.spec.ts`: `ReportErrorKind` union (`network | timeout | validation | not-found | forbidden | internal | unknown`), `ReportError` interface (`kind`, `message`, `retryable`, `correlationId?`, PII-safe `details?`), `toReportError(error, fallbackKind?)` normalizer (Error/string/shape-passthrough/unknown, never throws). Done: `npx nx test m3kit-core` green for the new spec
- [ ] T004 [US1] Create `libs/core/src/lib/load-state.ts` + `load-state.spec.ts`: the six-kind `LoadState<T>` union per plan.md (idle/loading/refreshing/success/empty/error; `stale` flag on data-bearing kinds; error carries optional last-good data), `loadStateData` helper, per-kind guards. Imports `ReportError` from T003. Done: spec covers every kind + guard
- [ ] T005 [P] [US1] Create `libs/core/src/lib/temporal.ts` + `temporal.spec.ts`: `ReportFormattingPolicy { locale, timeZone, currencyCode? }`, `DateRange` (UTC ISO instants, half-open `[start, end)` documented as the kit convention), `RelativeDateRangeKey` (`today | yesterday | last7days | last30days | thisMonth | lastMonth | thisYear`), `resolveDateRange(key, now, timeZone)` via `Intl` only. Done: specs pin a DST-transition date, Jan-31 → `lastMonth`, and one zone ahead of + one behind UTC
- [ ] T006 [P] [US1] Create `libs/core/src/lib/query-serialization.ts` + `query-serialization.spec.ts`: `DATA_QUERY_SCHEMA_VERSION = 1`, `SerializedDataQuery` envelope (flat, defaults omitted, explicit property order ⇒ deterministic `JSON.stringify`), `serializeDataQuery`, `deserializeDataQuery(unknown): DataQuery | null` (validate → migrate via `migrateSerializedQuery` switch → merge `createDefaultQuery()` defaults; `null` on garbage or future version), `encodeDataQueryParam`/`decodeDataQueryParam` (compact JSON for one router param), `dataQueryHash` (FNV-1a 32-bit hex over canonical JSON). Done: round-trip (deserialize∘serialize = normalize), recorded older-version fixture migrates, garbage/future → `null`, equal queries hash identically
- [ ] T007 [P] [US1] Create `libs/core/src/lib/column-state.ts` + `column-state.spec.ts`: `ColumnViewState { key; visible?; pinned?: 'start' | 'end'; width? }` (array order = display order), `ResolvedColumn<T>`, `resolveColumns(columns, state?)` with the plan's rules (unknown keys dropped, duplicates first-wins, unlisted appended in definition order, `visible: false` removed, state width overrides definition width). Done: each rule has a dedicated spec case incl. the all-hidden edge
- [ ] T008 [US1] Create `libs/core/src/lib/saved-view.ts` + `saved-view.spec.ts` (after T006, T007): `SAVED_VIEW_SCHEMA_VERSION = 1`, `SavedView` model per plan.md, `createSavedView` (stamps version/timestamps), `parseSavedView(unknown): SavedView | null` (validate + migration hook), `applySavedView(view, definition)` (`null` on reportId mismatch; invalid sort key falls back to `definition.defaultSort ?? null`; unknown column keys drop). Done: specs cover dropped-column view, removed-sort-key fallback, mismatched reportId, future-version rejection
- [ ] T009 [US1] Create `libs/core/src/lib/export.ts` + `export.spec.ts` (after T003, T005, T006): `ExportFormat ('csv' | 'json')`, `ExportScope ('page' | 'all' | 'selection')`, `ExportColumn`, `ExportRequest`, discriminated `ExportResult`, `flattenRows` (optional `ReportFormattingPolicy`-aware date/number/currency formatting), `rowsToCsv` (header row, RFC-4180-style quoting of `"` `,` CR LF, doubled quotes, `'`-prefix neutralization of leading `= + - @`), `rowsToJson`, `buildExportFilename` (deterministic, lowercase, `[a-z0-9-_]`-sanitized), `createExportResult`. No browser/download code. Done: escaping + injection + zero-row + filename-determinism specs green (SC-003)
- [ ] T010 [P] [US1] Create `libs/core/src/lib/telemetry.ts` + `telemetry.spec.ts` (after T003): `ReportTelemetryEvent` union per plan.md (`report.query_changed`, `report.fetch_started/succeeded/failed`, `report.empty_result`, `report.export_requested/completed/failed`, `report.saved_view_created/applied/deleted`) with common `{ type, reportId, at, correlationId? }` fields, query identity via `queryHash` only; `ReportTelemetryReporter` interface; the redaction rule in doc comments. Done: type-level spec constructs every variant; no field accepts raw filter text by construction
- [ ] T011 [US1] Export the entire foundation from `libs/core/src/index.ts` (after T003–T010) and run the US1 audits: `npx nx test m3kit-core && npx nx lint m3kit-core` green; `grep -rE "@angular|material|cdk" libs/core/src` empty; `git diff package.json` empty (FR-012, SC-006)

**Checkpoint**: Foundation ready — Batch 2 integration can begin

---

## Phase 3: User Story 2 — Table and state consume the foundation (Priority: P2)

**Goal**: `withDataQuery` exposes `loadState`/`ReportError`/stale/telemetry; `m3k-data-table` renders `ColumnViewState`; the full state taxonomy is demonstrated with `@m3kit/feedback`

**Independent Test**: `npx nx test m3kit-state m3kit-table` green; `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run m3kit-table:component-test` green; taxonomy story renders all six kinds

- [ ] T012 [US2] Create `libs/state/src/lib/telemetry-token.ts` + `telemetry-token.spec.ts`: `REPORT_TELEMETRY_REPORTER = new InjectionToken<ReportTelemetryReporter>(…, { factory: () => noop })`; export from `libs/state/src/index.ts`. Done: injecting without a provider yields the no-op (spec)
- [ ] T013 [US2] Extend `libs/state/src/lib/with-data-query.ts` + `with-data-query.spec.ts` (after T012): state gains `hasFetched`/`stale`; `error` becomes `ReportError | null` (via `toReportError`); new computeds `errorMessage: string | null` and `loadState: LoadState<DataPage<T>>` per the plan's derivation (loading vs. refreshing-with-retained-rows, error carrying last good page, empty on zero rows, stale forwarded); new `markStale()` clearing on next success; `WithDataQueryOptions.reportId?`; emit `query_changed`/`fetch_started`/`fetch_succeeded`/`fetch_failed`/`empty_result` through the injected reporter with `dataQueryHash` + `durationMs`. Update in-repo `store.error()` bindings (`apps/demo-reporting/src/app/reports/reports.component.*`, `customers-report.component.*`, `data-table-store-driven.stories.ts`) to `errorMessage()`; keep `libs/state/src/lib/with-data-query.docs.mdx` truthful for the new surface. Done: spec walks idle→loading→success/empty/error→refreshing incl. `markStale`, asserts telemetry events carry hashes and never raw filter text (SC-004, SC-007); `npx nx test m3kit-state demo-reporting` green
- [ ] T014 [P] [US2] Extend `m3k-data-table` in `libs/table/src/lib/data-table.component.{ts,html,scss}`: `columnState = input<readonly ColumnViewState[] | undefined>(undefined)`; `columns`/`displayedColumns` computed through `resolveColumns`; per-column `sticky`/`stickyEnd` from the resolution; resolved width wins over definition width; pinned-edge divider via `--mat-sys-outline-variant` and sticky surfaces via system surface tokens only (no hex, no per-brand selectors); outputs and fetch behavior unchanged. Done: `npx nx lint m3kit-table` green
- [ ] T015 [US2] Extend the table coverage artifacts (after T014) in `libs/table/src/lib/`: `data-table.component.spec.ts` (hide, reorder, pin start/end, width override, duplicate/unknown keys, definition-change re-resolution, controlled-mode events unchanged), `data-table.component.stories.ts` (a column-state story over synthetic invoices: hidden + reordered + pinned columns, presentable under the Storybook brand toolbar), `data-table.component.cy.ts` (sticky position assertions while horizontally scrolled, hidden column absent); keep `libs/table/src/lib/data-table.docs.mdx` truthful for the new input. Done: `npx nx test m3kit-table` and `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run m3kit-table:component-test` green (SC-005)
- [ ] T016 [US2] Create the taxonomy composition story `apps/demo-reporting/src/app/reports/report-load-states.stories.ts` (after T013, T014): one story per `LoadState` kind composing `m3k-data-table` with `@m3kit/feedback` — plain frame (idle), `m3k-skeleton` (loading), table + progress (refreshing), populated table (success), `m3k-empty-state` (empty), `m3k-error-state` + retry (error), plus a success-with-`stale`-flag variant carrying an `m3k-banner` + refresh affordance — driven by a `withDataQuery` store over stub datasources (synthetic invoices; inline erroring stub for the error kind). Done: all six kinds plus the stale variant render in Storybook; `npx nx run m3kit-table:build-storybook` compiles clean (SC-004)

**Checkpoint**: At this point, User Stories 1 AND 2 are independently functional — Batch 3 can begin

---

## Phase 4: User Story 3 — Demo workflow: URL state, saved views, export path (Priority: P3)

**Goal**: The invoices report demonstrates the end-to-end workflow against in-memory data; the customers report reuses the URL helper; everything app-side is clearly the part consumers replace

**Independent Test**: `npx nx serve demo-reporting`, walk the invoices report (URL round-trip, saved-view switching, CSV/JSON download, console telemetry); `npx nx test demo-reporting` green

- [ ] T017 [P] [US3] Create `apps/demo-reporting/src/app/reports/report-url-state.ts` + `report-url-state.spec.ts`: app-policy helper owning the `q` query-param contract — decode on init (tampered/garbage → default query, FR-016), `router.navigate` with `replaceUrl: true` on query change, optional applied-view column-state handling. Done: spec round-trips a query through the param and degrades garbage to defaults with a router stub
- [ ] T018 [P] [US3] Create `apps/demo-reporting/src/app/reports/saved-views.service.ts` + `saved-views.service.spec.ts`: in-memory signal registry seeded with two authored `SavedView` fixtures over `INVOICES_TABLE_DEFINITION` (e.g. "Overdue invoices": status field filter + dueAt sort + pinned amount column; "High-value recent": amount-desc sort + hidden columns) created via `createSavedView`; `views()`/`create()`/`delete()`; reports `saved_view_created/applied/deleted` telemetry. Done: spec covers seeding, apply-through-`applySavedView`, and delete
- [ ] T019 [P] [US3] Create `apps/demo-reporting/src/app/reports/export-download.ts` + `export-download.spec.ts` (Blob/object-URL/anchor trigger, JSDOM-safe via injectable document) and `apps/demo-reporting/src/app/reports/console-telemetry.ts` + `console-telemetry.spec.ts` (console-grouping `ReportTelemetryReporter`); provide the reporter against `REPORT_TELEMETRY_REPORTER` in `apps/demo-reporting/src/app/app.config.ts`. Done: download spec asserts filename/media type from an `ExportResult`; reporter spec asserts events log without mutation
- [ ] T020 [US3] Upgrade the invoices report `apps/demo-reporting/src/app/reports/reports.component.{ts,html,scss}` (after T017, T018, T019): wire `report-url-state` (restore on load, sync on change), saved-view picker on the page-toolbar action slot (MatMenu, precedent: app brand switcher) applying query + `columnState` together and updating the URL, export menu (CSV/JSON × current page/all filtered rows) building `ExportRequest` from the live store query + resolved visible columns through `createExportResult` + `export-download`, `markStale`-driven `m3k-banner` + refresh affordance, `reportId` set on the store for telemetry. Token-only styling for anything visual; synthetic data only. Done: `npx nx lint demo-reporting` green
- [ ] T021 [US3] Update invoices page coverage `apps/demo-reporting/src/app/reports/reports.component.spec.ts` + `reports.component.stories.ts` (after T020): spec asserts URL round-trip (SC-002), saved-view application updates rows + columns + URL together, export content matches the live query's rows for both formats and scopes (SC-003, no network), telemetry events observed via a test reporter; story keeps the `withDisabledInitialNavigation` router pattern. Done: `npx nx test demo-reporting` green
- [ ] T022 [P] [US3] Reuse the URL-state helper on the customers report `apps/demo-reporting/src/app/reports/customers-report.component.{ts,spec.ts}` (after T017): decode-on-init + sync-on-change only (no saved views/export — reuse proof, FR-016). Done: customers spec covers the round-trip; serve-and-walk confirms both pages restore from copied URLs

**Checkpoint**: All user stories independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Truthful docs and the full gate

- [ ] T023 [P] Fill `docs/REPORTING_FOUNDATION.md` (skeleton from T002): server-side query contract walkthrough (`DataQuery`/`DataPage` ↔ backend request/response translation example, connect-free fetch semantics, `totalCount`), state-taxonomy → `@m3kit/feedback` mapping table, saved-view + URL-state pattern (incl. which demo files are app policy to replace), export baseline-vs-adapter boundary table, temporal conventions (UTC instants, half-open ranges), telemetry redaction rule
- [ ] T024 [P] Update the remaining docs to stay truthful: AGENTS.md component/contract inventory (core gains the foundation modules; table's `columnState`; state's `loadState`/telemetry token) and HOW-TO additions if warranted; README repo map if it lists core modules; finalize the T001 ADR against what actually shipped; confirm `docs/BOUNDARY_LOG.md` contains an entry for every external consultation made during the feature (target: none) — logged at consultation time, never retroactively
- [ ] T025 Full gate (strictly last): `npx nx run-many -t lint test build && ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run-many -t component-test && npx nx run m3kit-table:build-storybook` — all green, taxonomy + column-state stories visible in the Storybook build, core import audit re-run (`grep -rE "@angular|material|cdk" libs/core/src` empty), `package.json` diff-free; record completion evidence at the foot of this file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001/T002 parallel
- **Foundational (Phase 2 / US1)**: Depends on nothing in code (Setup is docs-only) — BLOCKS all other stories. Within it: T003 → T004; T005/T006/T007/T010 parallel once T003 exists (T010 needs T003); T008 after T006+T007; T009 after T003+T005+T006; T011 strictly last
- **User Story 2 (Phase 3)**: Depends on T011. State track (T012 → T013) and table track (T014 → T015) are mutually independent; T016 needs both tracks
- **User Story 3 (Phase 4)**: Depends on Phase 3 (the page binds `errorMessage`, `loadState`, `columnState`). T017/T018/T019 parallel; T020 → T021 sequential on them; T022 after T017
- **Polish (Phase 5)**: T023/T024 can overlap late Phase 4; T025 strictly last

### User Story Dependencies

- **US1 (P1)**: None — pure core additions
- **US2 (P2)**: US1 (imports every contract)
- **US3 (P3)**: US1 + US2 (demo consumes the integrated surfaces)

### Parallel Opportunities

- T001 ∥ T002
- T005, T006, T007, T010 (independent core modules, after T003/T004)
- State track (T012–T013) ∥ table track (T014–T015)
- T017 ∥ T018 ∥ T019; T022 ∥ T020 once T017 lands
- T023 ∥ T024 ∥ late Phase 4; T025 alone, last

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (decisions on record)
2. Complete Phase 2 — the contracts ARE the parity foundation; they are independently shippable and liftable
3. **STOP and VALIDATE**: `npx nx test m3kit-core && npx nx lint m3kit-core`, import audit empty, no `package.json` diff

### Incremental Delivery

1. Batch 1 → core foundation typed, specced, exported (MVP)
2. Batch 2 → store + table speak the foundation; taxonomy demonstrated
3. Batch 3 → demo workflow end-to-end; docs truthful; full gate green

---

## Out of Scope (Future Phases)

Listed only so nobody starts them now (full rationale in spec.md Out of Scope):

1. **PDF/XLSX/print export engines and server export jobs** — adapter docs only
2. **Saved-view persistence adapters** (localStorage/REST/IndexedDB) — demo registry is in-memory
3. **Interactive column chrome** (drag-reorder, resize grips, column-picker menu) — model is headless this wave
4. **Operator-rich filter model** (ranges/contains/in-list/relative-date wired into `FilterState`)
5. **Virtualization, grouping/aggregation, pivot, geospatial contracts** — separate roadmap phases
6. **E2E setup, CI provider config, publishing** — unchanged standing deferrals

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Clean-room rules apply to every task: public sources only, every consultation logged in `docs/BOUNDARY_LOG.md` as it happens (the intent for this feature is zero consultations), synthetic domains only (customers, orders, invoices, support tickets, products)
- DESIGN.md is binding for every visual decision; this feature composes existing visual components and adds no new visual language
- Core stays UI-free: any task that wants an `@angular/*` import inside `libs/core` is wrong by definition — the Angular-facing home is `libs/state` or the demo app
- The three deferred-scope decisions (column-picker UI, localStorage adapter, SavedView density field) are settled as "deferred" in spec.md; do not implement them speculatively
- Commit after each task or logical group; stop at any checkpoint to validate independently
