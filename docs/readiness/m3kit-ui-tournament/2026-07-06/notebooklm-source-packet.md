# m3kit UI Component Tournament v2 — NotebookLM Source Packet

This packet is a source bundle for proposal-only tournament contestants. No NotebookLM source URL was created in this run.

## Mission constraints

- Produce proposals/prototypes only; no main implementation mutation until Jared approves a next Spec Kit feature pack.
- Preserve m3kit's clean-room, source-internalized, rethemable Material 3 reference-library model.
- Components must use the public `m3k-*` API and consume only Material system tokens plus the closed `--app-*` contract.
- No raw colors, no per-brand component selectors, no chart/UI dependency additions, no real data, no backends, no hosted endpoints, no credentials, no model downloads.
- Every exported component must eventually ship unit spec, Storybook story, and Cypress component test beside the component.

## Repository baseline

- Angular 19 / Nx 20 monorepo, package manager pnpm.
- Runtime dependencies are Angular, Angular Material/CDK, RxJS, zone.js, and `@ngrx/signals`; no third-party chart/UI library is allowed.
- Library graph: `core` and `theme` are roots; UI libraries (`table`, `dashboard`, `charts`, `forms`, `shell`, `feedback`, `testing`) may depend only on `core` and theme tokens as documented in AGENTS.md.
- Storybook host is `m3kit-table`; parity gallery under `libs/table/.storybook/parity/` is the brand-range regression surface.

## Current exported UI surface

- table: `m3k-data-table`, `m3k-table-filter-bar`, `m3k-page-toolbar`, `m3k-tree`.
- dashboard: `m3k-dashboard-grid`, `m3k-kpi-card`, `m3k-kpi-strip`, `m3k-detail-card`, `m3k-stat-list`, `m3k-description-list`, `m3k-timeline`.
- charts: `m3k-line-chart`, `m3k-bar-chart`, `m3k-donut-chart`, `m3k-chart-legend`, `m3k-chart-card`.
- forms: `m3k-form-field`, `m3k-form-section`, `m3k-filter-form`.
- shell: `m3k-app-shell`, `m3k-page-header`, `m3k-breadcrumbs`, `m3k-content-layout`, `m3k-tabs-page`, `m3k-stepper-flow`, `m3k-overflow-menu`, `m3k-list-page`, plus shell template slots.
- feedback: `m3k-empty-state`, `m3k-error-state`, `m3k-banner`, `m3k-skeleton`, `m3k-confirm-dialog`, snackbar service.

## Design doctrine

- Industrial-editorial "Instruments": precision-tool energy, paper-grade clarity, serious production software.
- Typography: DM Serif Display for page titles/large KPI values, Instrument Sans for UI/body, JetBrains Mono for data/code.
- Color: cobalt primary, sienna tertiary, tokenized status and chart palettes. Dark mode is first-class.
- Density: tables -2, forms/filter panels -1, cards/navigation 0.
- Layout: grid-disciplined and reporting-first; demo brands can choose app-side layout presets but libraries stay brand/layout-neutral.
- Anti-patterns: gradients-as-brand, glassmorphism, purple bias, shadow-on-everything, rainbow status pills, skeleton-shimmer theater, oversized icons, hero/landing pages.

## Readiness gaps from docs and repo inspection

- Table/report grid parity gaps: column resize/reorder/pinning UI, column manager, expandable/detail rows, virtual-scroll variant, export/saved-view actions.
- Filters/forms/date gaps: richer operator model, relative date filters, timezone-aware query patches, validation summary.
- Dashboard/page gaps: saved-view picker/manager, export menu/action slots, refresh/stale indicators, drill links.
- Chart gaps: chart-level error/loading/empty state contracts, accessible summaries/table fallback, tooltips/selection only if keyboard accessible, SVG export helper, larger data decimation.
- Maps/geospatial gaps: only optional future seam; no API-key vendor map should land as a baseline UI feature.
- Documentation gaps: API tables, keyboard behavior, accessibility notes, internalization checklists, parity dashboard.

## @m3kit/ai port context approved by parent gate

Parent gate approved the uncommitted `@m3kit/ai` port in `/home/red/angular-reporting-reference/.worktrees/t_5057bd9c`.

Shipped slice:
- `libs/ai` import path `@m3kit/ai`, Nx project `m3kit-ai`.
- Generic task protocol: request/result/error/progress/main-thread/worker messages.
- `M3kAiRuntimeAdapter` seam and `defineM3kAiAdapter` helper.
- Deterministic `M3kAiFakeAdapter` for tests and demos.
- Worker harness for init, task, cancel, result, stream chunk, and error flows.
- Warmup skip heuristics for disabled, unsupported Worker, save-data, slow connection, and low storage.
- Validators for bounded strings, sentence counts, and JSON objects.
- Privacy-safe telemetry: no-op sink plus allow-list redaction; prompt/input/output are not emitted by default.

Guardrails:
- No model downloads in CI.
- No provider SDK dependencies.
- No hosted endpoint or API-key storage by default.
- No UI assistant/tournament flow in the port slice.
- Provider adapters, app-side demo integration, and AI assistant UI exploration require separate specs and review gates.

Parent gate evidence:
- `NX_DAEMON=false corepack pnpm@10.14.0 exec nx run-many -t lint,test,build --all --skip-nx-cache` passed in the implementation worktree: 13 projects, including `m3kit-ai` 6 spec files / 13 tests; demo build budget warnings only.
- `gitleaks detect --no-git --source specs docs --redact=20 --verbose` passed.
- `git diff --check` passed.
- Caveat: implementation is uncommitted/untracked on branch `wt/m3kit-ai-port`; tournament source should cite that exact worktree rather than assume main contains `libs/ai`.

## Contestant output contract

Each entry must pick exactly one feature from the shared candidate list, or add one self-proposed feature with rationale and acceptance criteria. Entry packet must include:

1. Feature selected.
2. Rationale tied to m3kit launch/readiness.
3. Component API sketch.
4. UX states.
5. Token/theming plan.
6. Accessibility notes.
7. Storybook/unit/Cypress test plan.
8. Feasibility and implementation sequence.
9. Evidence: repo paths/docs consulted and any commands run.
10. Risks / rejection conditions.

## Evidence gate / scoring rubric

Reject or penalize entries that:
- Drift into generic AI aesthetics, marketing/hero pages, or purple/glass/gradient motifs.
- Depend on inaccessible state handling or color-only meaning.
- Violate token-only styling, `m3k-*` public API, library boundaries, synthetic-data-only, or no-new-dependency rules.
- Claim unsupported existing components or APIs.
- Require hosted endpoints, credentials, model downloads, or provider SDKs for baseline functionality.

Score dimensions, 0-5 each:
- Contract fit and boundary safety.
- Launch/readiness impact.
- UX/component API quality.
- Accessibility and state coverage.
- Test/Storybook/evidence quality.
- Implementation feasibility.
