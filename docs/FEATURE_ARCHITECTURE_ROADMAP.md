# Enterprise Reporting Feature Architecture Roadmap

This report identifies the architecture needed to make the Angular reporting kit robust beyond the current tables, charts, dashboards, forms, shell, and theming demo. It preserves the repository contract: source-internalized reference code, synthetic data only, clean-room implementation, and strict library boundaries.

## Current baseline

- `libs/core` is UI-free and currently owns table/report contracts, query models, datasource interface, and an in-memory datasource.
- `libs/theme` is SCSS-only and owns the closed token contract plus the default brand.
- UI libraries (`table`, `dashboard`, `charts`, `forms`, `shell`) depend only on `core` and the theme token contract.
- `apps/demo-reporting` composes all libraries and is disposable living documentation.
- Charts are hand-written SVG by policy. Any dependency addition must be justified in `docs/DECISIONS.md`.
- There is no e2e project yet; coverage is unit specs, Storybook stories, and Cypress component tests for exported components.

## Target architecture principle

Keep reusable, durable semantics in `core`; keep rendering in UI libraries; keep vendor/framework integrations in optional adapters; keep realistic wiring and synthetic examples in the demo. The kit should be copied and owned by consumers, so each feature must be useful when lifted independently and must not require hidden app assumptions.

## Capability map: core vs UI libs vs adapters/demo

| Capability | Belongs in `core` | Belongs in UI libs | Optional adapter / demo responsibility |
|---|---|---|---|
| Data contracts | Report identity, fields, measures, dimensions, schemas, value kinds, formatting metadata, semantic status, validation helpers | Render metadata: column labels, chart labels, dashboard card inputs | Demo synthetic report catalog and examples |
| Query/state | Immutable `ReportQuery`, filter operators, sort, page, cursor, grouping, aggregation, time range, serialization/versioning | Controls that emit query patches; components display query-driven data | Router query-param sync, NgRx/signals app stores, API-specific query translators |
| Loading/error/empty states | `LoadState<T>`, `ReportError`, retry metadata, stale/refresh states | Reusable state panels/skeleton slots in table/chart/card shells | Demo network-latency/error scenarios |
| Virtualization | Query/page contracts that support offset/cursor/window ranges; stable row identity | CDK virtual-scroll table variant, sticky headers, column sizing | Demo large synthetic datasets/perf playground |
| Exports | Export job/request/format contracts, column projection, filename policy hooks, data flattening helpers | Export buttons/menus only if dependency-light | CSV/JSON/Excel/PDF/server-export adapters; demo CSV export only if no new deps |
| Saved views | View model contract: query + visible columns + sort + density + chart options + version/migration | Saved-view picker/manager UI | LocalStorage adapter in demo; enterprise persistence adapter examples as docs |
| Accessibility | Core metadata for labels/descriptions; deterministic IDs if needed | ARIA, keyboard, focus management, high contrast, reduced motion, live regions | Automated a11y checks in Storybook/Cypress if dependency approved |
| i18n/timezones | Locale/timezone/currency formatting policy types; date range semantics; UTC vs local conventions | Components accept formatter/policy inputs or injection tokens | Demo locale/timezone switcher, docs for Angular locale registration |
| Observability | Event contracts: query changed, fetch started/succeeded/failed, export requested, view saved; redaction policy | Components emit structured events or call injected reporter | Console reporter in demo; OpenTelemetry/vendor adapters outside core |
| Test matrix | Shared test fixtures/contracts and conformance suites | Per-component states/stories/cy tests | Demo smoke/e2e later; adapter contract tests |
| Theming | Token names and compile-time validation in `theme` | Components consume tokens only | Demo brands and theme switcher examples |
| Docs/internalization | Boundary/adoption docs, feature ADRs, copy-in guidance | Component READMEs and stories | Demo as living cookbook; migration/internalization checklist |
| Maps | Generic geospatial contracts: lat/lng, bounds, marker, region, choropleth data, map query viewport | If dependency-free, maybe simple SVG/HTML map shell only | Google Maps, MapLibre, Esri, etc. adapters and demo wiring only |

## Recommended core additions

1. **Generalize from table contracts to report contracts.** Add a UI-free `ReportDefinition<T>` layer that can describe tabular columns, chart dimensions/measures, KPIs, map layers, and export projections. Keep `TableDefinition<T>` as a compatibility specialization or rename only in a breaking feature branch.
2. **Add a typed `ReportDataSource<TQuery, TResult>`.** The current `TableDataSource<T>` is good: cold request/response observable, one emission, no retained view state. Generalize it for pages, aggregates, time series, KPI summaries, and map feature collections.
3. **Codify query serialization.** Add pure helpers for stable query JSON, URL-safe encoding, version numbers, default merging, and migration from saved views. This is essential for bookmarks, saved views, cache keys, exports, and observability.
4. **Represent state explicitly.** Add `LoadState<T>` (`idle | loading | success | empty | error | refreshing`) and `ReportError` (`kind`, `message`, optional `retryable`, `correlationId`, safe `details`). Components should stop collapsing errors to booleans.
5. **Introduce formatting and temporal policy contracts.** Define policy types for `locale`, `timezone`, `currency`, `dateStyle`, `numberStyle`, and date range inclusivity. UI libs can use Angular formatters, while adapters can translate to backend/API semantics.
6. **Define saved view contracts.** A saved view should include `reportId`, `viewId`, `name`, `query`, visible fields, sort, page size, density/layout options, visualization options, version, timestamps, and owner/scope metadata. Persistence is not core.
7. **Define export contracts.** Core should own `ExportRequest`, `ExportFormat`, field projection, filter/sort snapshot, selected-row semantics, filename metadata, and pure flattening helpers. It should not own browser downloads or Excel/PDF libraries.
8. **Define geospatial contracts without map vendor types.** Use plain types for `GeoPoint`, `GeoBounds`, `GeoMarker`, `GeoRegion`, `MapLayerDefinition`, viewport query patches, clustering hints, and selection events. Never leak `google.maps.*` into core.
9. **Define observability event contracts.** Core should export a small `ReportTelemetryEvent` union and redaction guidance. UI libs can emit events; adapters decide where they go.

## Recommended UI library additions

### Table

- Split current state handling into a reusable query controller/service or signal store, but keep it UI-local unless it is fully UI-free.
- Add customizable state slots/messages for loading, empty, error, refreshing, and stale-data states.
- Add CDK virtual-scroll variant only in `table`, not `core`; expose stable row identity input and keyboard/focus behavior.
- Add column visibility/reorder/resizing only after saved-view contracts exist.
- Add export and saved-view toolbar slots rather than hard dependencies.

### Charts

- Keep dependency-free SVG. Add core-compatible chart data contracts for time series, categories, measures, and empty/error states.
- Add accessible summaries: `ariaLabel`, optional `ariaDescription`, table fallback/story examples, and non-color encodings where possible.
- Add tooltip/selection only if keyboard-accessible and testable.
- Keep chart adapters out unless a future ADR permits a third-party chart dependency.

### Dashboard

- Add dashboard-level state containers for KPI loading/error/empty and stale refresh indicators.
- Add layout persistence metadata only through saved-view contracts; the grid itself stays presentation-only.

### Forms

- Add richer filter operators: equals, contains, startsWith, range, in-list, exists, relative date, and timezone-aware date range.
- Emit typed query patches rather than raw field maps once the core query model exists.

### Shell

- Provide slots for global report actions (export, saved views, refresh, timezone/locale selectors), but keep app policy in the demo/app.
- Add skip links/focus restoration patterns for routed reporting pages.

## Optional adapters and demo-only work

### Google Maps integration

Do **not** put Google Maps in `core` or existing UI libs. Add it as an optional adapter, e.g. `libs/adapters/google-maps` or keep it demo-only until there is enough confidence. Reasons:

- It introduces network/API-key/runtime script concerns.
- It brings vendor types and lifecycle semantics that conflict with the clean UI-free core boundary.
- Enterprise consumers often use different map vendors or internal GIS components.

Adapter shape:

- Inputs: core `MapLayerDefinition`, `GeoMarker[]`, `GeoRegion[]`, viewport/query state, selection state.
- Outputs: viewport changed, marker/region selected, layer toggled, map error.
- Responsibilities: load/accept Google Maps API, translate core types to `google.maps.*`, manage markers/clusters/info windows, expose loading/error states, document API-key setup.
- Demo: use synthetic coordinates only and provide a no-key fallback/mock map story to keep the repo runnable without secrets.

### Export adapters

- Core: CSV-safe flattening and export request snapshots.
- Demo/adapter: browser download, CSV generation, server job polling, Excel/PDF if dependency approved.
- Avoid shipping Excel/PDF dependencies in core/UI libs.

### Persistence adapters

- Core: saved view contracts and migrations.
- Demo: LocalStorage adapter.
- Optional adapters: REST persistence, IndexedDB, user-preference service. Keep auth/tenant concerns out of core.

### Observability adapters

- Core: event union and redaction policy.
- Demo: console logger/dev panel.
- Optional adapters: OpenTelemetry, Datadog, Splunk, custom analytics. These must be additive and removable.

## Accessibility robustness checklist

- Every interactive row, marker, saved view, export action, and chart selection must be keyboard reachable and screen-reader named.
- Tables need sortable-header announcements, row action semantics, focus ring visibility, no keyboard trap in virtual scroll, and correct empty/error live-region behavior.
- Charts need `role="img"`, labels/descriptions, hidden data tables or textual summaries for complex visuals, and no color-only meaning.
- Maps need keyboard pan/zoom, marker list alternative, selected marker announcement, and fallback content when the vendor map fails.
- Respect forced colors, reduced motion, zoom to 200%, and touch target sizing.

## I18n, timezone, and data correctness checklist

- Store/query instants in UTC; display in a configured timezone.
- Distinguish date-only business dates from instants.
- Make date range endpoints explicit: inclusive start, exclusive end is recommended for backends.
- Include locale-aware number/currency/date formatting in table, KPI, chart axes/tooltips, exports, and filenames.
- Test DST transitions, non-US date formats, RTL layout, long translated labels, non-USD currencies, and large/negative numbers.

## Observability events to standardize

- `report.query_changed`
- `report.fetch_started`
- `report.fetch_succeeded`
- `report.fetch_failed`
- `report.empty_result`
- `report.export_requested`
- `report.export_succeeded`
- `report.export_failed`
- `report.saved_view_created`
- `report.saved_view_applied`
- `report.saved_view_deleted`
- `report.map_viewport_changed`
- `report.map_feature_selected`

Events should include report id, view id where safe, query hash rather than raw PII-bearing query text, row counts, duration, error kind, retryable flag, and correlation id.

## Test matrix

| Area | Minimum tests |
|---|---|
| Core contracts | Query merge/serialization/migration, filter operators, export flattening, saved view versioning, timezone date ranges |
| Datasources | Cold one-shot behavior, cancellation/race via `switchMap`, retryable errors, empty results, total counts/windows |
| Table | Loading/empty/error/refresh states, sorting/filtering/paging, keyboard row activation, virtual scroll, column visibility, locale formatting |
| Charts | No data, single point, negative/zero values, long labels, responsive width, a11y labels, dark/light tokens |
| Forms | Operator-specific controls, debounce/reset behavior, dirty value emission, date range timezone semantics |
| Saved views | Create/apply/update/delete, migrations, invalid view handling, persistence adapter failures |
| Exports | Current query snapshot, visible columns, CSV escaping, locale/timezone formatting, large dataset async/server-job path |
| Maps | Vendor load failure, no-key fallback, marker selection, viewport query patch, cluster/large marker perf, keyboard alternative list |
| Theming | Token-only styles, all brands light/dark, forced colors where possible, high-contrast series/status colors |
| Internalization | Boundary lint proof, copy-in docs, dependency reconciliation, no demo-only imports in libs |

## Sequenced implementation plan

### Phase 0 — Architecture ADRs and naming

- Write ADRs for report-contract generalization, optional adapter policy, saved-view/export boundaries, and map-vendor isolation.
- Decide whether to preserve `TableDefinition` as-is and add `ReportDefinition`, or migrate names in a larger breaking change.
- Add docs that explicitly classify core/UI/adapter/demo ownership.

### Phase 1 — Core robustness foundation

- Add `LoadState`, `ReportError`, generalized `ReportDataSource`, query serialization, query hash, temporal/formatting policies, saved-view contracts, export request contracts, telemetry event contracts, and geospatial plain types.
- Keep all code pure TypeScript with no Angular Material/CDK/vendor imports.
- Add unit tests and conformance fixtures in `libs/testing`.

### Phase 2 — Existing UI components consume the foundation

- Refactor table to use richer state and query patch contracts.
- Add state slots/messages to table and chart cards.
- Add forms that emit typed query patches/operators.
- Improve chart accessibility summaries and formatting policies.
- Update Storybook to show loading/error/empty/refresh/i18n states.

### Phase 3 — Saved views and exports

- Add saved-view UI primitives and demo LocalStorage adapter.
- Add export toolbar/menu primitives and a dependency-free CSV demo adapter.
- Ensure saved views round-trip URL/query state and survive migrations.

### Phase 4 — Performance and virtualization

- Add large synthetic datasets and perf stories.
- Implement table virtual-scroll variant in `libs/table` using CDK.
- Add datasource window/cursor conformance tests.
- Validate keyboard/focus behavior under virtualization.

### Phase 5 — Maps as optional adapter/demo

- Add core geospatial contracts if not already done.
- Build a no-secret demo map shell first.
- Add `google-maps` adapter only behind an ADR and with API-key-free fallback stories/tests.
- Keep vendor types out of core and out of unrelated UI libs.

### Phase 6 — Observability, docs, and internalization hardening

- Add telemetry reporter injection/outputs and console demo adapter.
- Expand adoption/internalization docs for optional adapters and what to delete.
- Add a reporting robustness guide with the test matrix and checklists.
- Re-run lint/test/component-test/storybook gates and record boundary proof.

## Key risks and mitigations

- **Core bloat:** keep core to contracts, pure helpers, and conformance tests; move browser/vendor behavior to adapters.
- **Dependency creep:** require ADRs for Google Maps, Excel/PDF, a11y tooling, or observability SDKs; prefer optional adapters.
- **Leaky vendor types:** enforce no `google.maps.*` or exporter SDK types outside adapter packages.
- **Demo becoming product code:** mark demo-only services clearly and document deletion/internalization guidance.
- **I18n/date bugs:** formalize temporal semantics before saved views and exports, because persisted queries and exported files amplify mistakes.
- **A11y regressions in virtualization/maps/charts:** treat keyboard and screen-reader alternatives as acceptance criteria, not polish.
