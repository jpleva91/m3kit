# m3kit UI Component Tournament v2 — Curated Feature Candidate List

Curated by Mission Commander from repo state, AGENTS.md/DESIGN.md, `docs/FEATURE_ARCHITECTURE_ROADMAP.md`, `docs/UI_KIT_PARITY_RESEARCH.md`, current component inventory, and the parent-approved `@m3kit/ai` port evidence.

## Selection criteria

A good candidate must:
- Strengthen public launch/readiness for a source-internalized Angular reporting kit.
- Fit the existing library graph and `m3k-*` API surface.
- Stay token-only and brand-neutral across all 12 brands × light/dark.
- Be useful without credentials, network sources, model downloads, or real data.
- Be independently spec-kittable with unit spec, Storybook story, and Cypress component test.

## Candidate A — Saved View Manager

Library: likely `libs/shell` for page/action surface plus `libs/core` saved-view contracts already present or extended.

Problem: Enterprise reporting users expect named, shareable views over query + columns + density. The docs call saved views a baseline differentiator, but there is no exported manager UI.

Feature shape:
- `m3k-saved-view-menu` or `m3k-saved-view-manager` with current view, save-as, update, delete, and apply affordances.
- Emits intents only; persistence adapter remains app/demo-owned.
- Supports invalid/migrated/deleted view states.

Acceptance criteria:
- No storage, backend, auth, or tenant assumptions in the component.
- Keyboard-accessible menu/dialog flow with labelled destructive actions.
- Storybook covers empty list, dirty current view, migration warning, delete confirmation, and 12-brand visual pass.

## Candidate B — Report Action Bar / Export Menu

Library: likely `libs/shell` or `libs/table` depending on scope.

Problem: Export, refresh, saved view, timezone/locale, and bulk actions are repeated across reporting pages. Current `m3k-page-toolbar` is table-local and not enough for full pages.

Feature shape:
- `m3k-report-action-bar` with slots for primary actions and a typed export action menu.
- Emits export requests using core export contracts; no Excel/PDF dependencies.
- Surfaces loading/disabled/pending states and selected-row context.

Acceptance criteria:
- CSV/JSON baseline only; Excel/PDF are adapter docs.
- ARIA labels for menu buttons, disabled reasons visible or described.
- Storybook covers no selection, selected rows, server-export pending, export error, narrow viewport.

## Candidate C — Chart State Frame and Accessible Data Fallback

Library: `libs/charts`.

Problem: `m3k-chart-card` has loading/empty states, but chart accessibility and error/fallback coverage are listed readiness gaps. Charts need consistent summary, data table fallback, and error state without leaking chart-engine assumptions.

Feature shape:
- `m3k-chart-state-frame` or extension of `m3k-chart-card` that wraps SVG charts with `ariaLabel`, `ariaDescription`, optional hidden/expandable data table fallback, loading/empty/error/refreshing/stale states.
- Keeps chart rendering dependency-free and token-only.

Acceptance criteria:
- Works with existing line/bar/donut/legend.
- No color-only meaning; supports textual summary.
- Storybook covers no data, loading, error, stale refresh, long labels, dark mode.

## Candidate D — Data Table Column Manager

Library: `libs/table`.

Problem: `m3k-data-table` already accepts headless `columnState`, but users need a first-class UI to toggle/reorder/pin columns and eventually save it into views.

Feature shape:
- `m3k-column-manager` component driven by `TableDefinition` + `ColumnViewState`.
- Emits column view-state changes; does not persist.
- Supports visible/hidden, reorder, pin left/right where `resolveColumns` can honor it; resize can remain future if necessary.

Acceptance criteria:
- No drag-only interaction; keyboard move up/down controls are mandatory.
- Handles required/locked columns.
- Storybook covers many columns, locked columns, hidden all disallowed, pinned columns, compact density.

## Candidate E — Relative Date / Query Filter Builder

Library: `libs/forms` plus `libs/core` query operator contracts.

Problem: Reporting products need date ranges like last 7 days, this month, custom range, and timezone policy. Current form field supports `date-range`, but the query/operator UX is not yet first class.

Feature shape:
- `m3k-relative-date-filter` or richer `m3k-filter-form` operator mode.
- Emits typed query patches with explicit timezone/inclusivity semantics.
- Supports preset chips and custom range.

Acceptance criteria:
- DST and timezone semantics documented; no local-date ambiguity.
- Keyboard and screen-reader usable presets/custom range.
- Unit tests for query patch generation and edge cases.

## Candidate F — Storybook Parity Dashboard

Library/docs: Storybook host under `libs/table/.storybook` and docs.

Problem: Launch readiness needs an honest surface showing baseline/adapter/docs/out-of-scope status against enterprise expectations and all brands/modes.

Feature shape:
- A Storybook page/MDX or Angular story rendering parity matrix badges from static metadata.
- Links to components, docs, and escape-hatch decisions.

Acceptance criteria:
- Static synthetic metadata only.
- Covers table, filters, dashboard, charts, maps, theming, docs.
- Does not overstate AG Grid/ECharts/Google Maps parity.

## Candidate G — No-Secret Map Preview Shell

Library: probably `libs/charts` or new optional/demo-only surface; high risk.

Problem: Geospatial appears in parity docs, but vendor maps require API keys/network. A no-secret SVG/static map/list shell could demonstrate the adapter seam.

Feature shape:
- Static region/marker preview with accessible list alternative.
- Uses core geo contracts if/when present.

Acceptance criteria:
- No Google/MapLibre dependencies and no API keys.
- Explicitly positioned as preview shell, not full map adapter.
- Strong accessibility fallback.

## Candidate H — AI Runtime Demo Assistant Shell (defer-biased)

Library/app: demo app integration over approved `@m3kit/ai`; likely not reusable UI library yet.

Problem: The `@m3kit/ai` port creates a runtime seam but intentionally excludes UI assistant/tournament flows.

Feature shape:
- App-side demo panel using `M3kAiFakeAdapter` to show summarization/extract/rewrite task lifecycle, warmup skipped/ready/failed states, and redacted telemetry.

Acceptance criteria:
- Fake adapter only; no provider SDKs, endpoints, credentials, or model downloads.
- Clearly demo-only until provider adapters pass a later gate.
- Useful as source packet evidence for future assistant UI but not the first public UI kit component unless paired with reporting workflows.

## Curator recommendation before contestants

Most tournament-worthy candidates are D, C, A, and B. D leverages an existing headless capability and is a concrete UI gap. C closes an accessibility/state gap across every chart. A/B are strategically valuable but require sharper contract decisions around persistence/export ownership. H is relevant to the parent `@m3kit/ai` port but should be treated cautiously because the gate explicitly kept assistant UI out of the first slice.
