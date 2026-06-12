# AGENTS.md — operating manual for AI agents

How to consume or extend m3kit. Terse, factual, command-accurate. The project
constitution (`.specify/memory/constitution.md`) supersedes everything here.

## What this is

m3kit is a clean-room, rethemable Material 3 UI component library — an
Angular 19 / Nx 20 reference monorepo of general-purpose UI (data tables,
dashboards, charts, typed forms, app shells, theming SDK), demonstrated by a
synthetic-data reporting demo app. It is a **reference to be read and copied, not a
dependency to be installed**: nothing is published to npm; consumers
source-internalize `libs/*` into their own workspaces. Components
consume design tokens only, so brands are pure token re-emissions and the
entire kit reskins (twelve brands — the Instruments default plus eleven
app-side consumers: Terminal, Ledger, Field Guide, Carbon, Brutalist, Meadow,
Beacon, Noir, Pop, Gazette, Synth — each light + dark) without touching
component code.

## Library graph and boundaries

| Project | Alias | May depend on (internal) |
|---|---|---|
| `libs/core` | `@m3kit/core` | nothing |
| `libs/theme` | none (SCSS-only) | nothing |
| `libs/table` | `@m3kit/table` | core, theme |
| `libs/testing` | `@m3kit/testing` | core, theme |
| `libs/dashboard` | `@m3kit/dashboard` | core, theme |
| `libs/charts` | `@m3kit/charts` | core, theme |
| `libs/forms` | `@m3kit/forms` | core, theme |
| `libs/shell` | `@m3kit/shell` | core, theme |
| `libs/feedback` | `@m3kit/feedback` | core, theme |
| `libs/state` | `@m3kit/state` | core | NgRx SignalStore features: withDataQuery, withSelection, theme store |
| `apps/demo-reporting` | — | all of the above |

Rules are machine-enforced by `@nx/enforce-module-boundaries` in the root
`eslint.config.mjs` (no permissive catch-all — any other direction fails
lint). **Do not fight the boundaries; code that needs a forbidden edge is
wrong by definition.** `theme` sits outside the TypeScript graph: it has no
tsconfig alias and is resolved via `stylePreprocessorOptions.includePaths:
["libs/theme/src"]` (set on the app's `build` target and the
`m3kit-table` Storybook targets) as `@use 'm3kit-theme'`.

Component inventory (exported barrels, `libs/*/src/index.ts`):
core — models, query engine, datasource interfaces, in-memory datasource;
table — `data-table`, `table-filter-bar`, `page-toolbar`, `tree`;
dashboard — `dashboard-grid`, `kpi-card`, `kpi-strip`, `detail-card`,
`stat-list`, `description-list`, `timeline`;
charts — `line-chart`, `bar-chart`, `donut-chart`, `chart-legend`,
`chart-card`; forms — `form-field`, `form-section`, `filter-form`;
shell — `app-shell` (four chrome presets), `page-header`, `breadcrumbs`,
`content-layout`, `tabs-page`, `stepper-flow`, `overflow-menu`,
`list-page`, plus the `ShellToolbarActionsDirective` /
`ShellRailFooterDirective` template slots;
feedback — `empty-state`, `error-state`, `banner`, `skeleton`,
`confirm-dialog` (component + service), `snackbar` (service);
testing — `seeded-random`, factories, sample table definitions.

## THE CONTRACT (binding)

1. **Token-only styling.** Component stylesheets consume `var(--mat-sys-*)`
   (M3 system tokens) and the `--app-*` contract defined in
   `libs/theme/src/m3kit-theme/_contract.scss` — nothing else. The
   contract is closed: `--app-status-{draft,sent,paid,overdue,void}-{bg,fg}`,
   `--app-radius-{card,control,badge}`, `--app-font-data`,
   `--app-chart-1..6`. No raw hex in components, no per-brand selectors
   (`html.theme-x .component` is forbidden). If a brand seems to need an
   escape hatch, the contract needs a new token — a documented decision.
2. **Material is the engine, not the API.** The public surface is the
   `m3k-*` component set plus the token contract; Angular Material is
   internal implementation. Brands may push past the stock Material look
   only via Material token overrides emitted inside `brand-light()` /
   `brand-dark()` (`mat.theme-overrides` and per-component
   `mat.<component>-overrides` mixins) — never per-brand component CSS;
   kit-specific gaps extend the `--app-*` contract instead. The Material
   Parity Storybook gallery (`libs/table/.storybook/parity/`) is the
   brand-range regression surface: all 12 brands × light/dark must stay
   presentable there.
3. **DESIGN.md is binding.** Read it before any visual decision: fonts,
   color, density splits, spacing, radii, motion, anti-patterns. Do not
   deviate without explicit user approval.
4. **No chart or UI library dependencies.** Charts are hand-built SVG; the
   dependency surface is Angular + Material/CDK + `@ngrx/signals`, period.
   Any new dependency requires justification in `docs/DECISIONS.md`.
5. **Synthetic data only.** Approved domains: customers, orders, invoices,
   support tickets, products. All data comes from `libs/testing`
   factories or repo-authored static JSON. No real data, no backends, no
   network sources.
6. **Clean-room rules.** Public sources only; log every external consultation
   in `docs/BOUNDARY_LOG.md` at the time it happens. Doubt resolves to
   exclusion.

## THE COVERAGE BAR

Every exported component ships three artifacts beside it in `src/lib/`:

- `*.spec.ts` — Vitest unit spec (`@nx/vite:test`)
- `*.stories.ts` — Storybook story (collected by the single Storybook host,
  `libs/table/.storybook/main.ts`, which globs table, charts,
  dashboard, feedback, forms, shell, state, and the demo app)
- `*.cy.ts` — Cypress component test (`component-test` target on table,
  charts, dashboard, feedback, forms, shell)

Commands (verified against `project.json` targets):

```sh
npx nx test <project>                  # e.g. nx test m3kit-dashboard
npx nx lint <project>
npx nx build demo-reporting            # libs are non-buildable by design
ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run <project>:component-test
npx nx run m3kit-table:storybook        # dev server, port 4400
npx nx run m3kit-table:build-storybook  # must compile clean
npx nx serve demo-reporting            # http://localhost:4200
```

The full gate (run before claiming any work done):

```sh
npx nx run-many -t lint test build \
  && ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run-many -t component-test \
  && npx nx run m3kit-table:build-storybook
```

## HOW TO

**Add a component.** Follow the existing patterns in
`libs/dashboard/src/lib` (e.g. `kpi-card.component.ts`): standalone
component, signal `input()`/`computed()`, `ChangeDetectionStrategy.OnPush`,
`m3k-` selector prefix, token-only `.scss`. Place it in the lib whose
boundary it fits, add all three coverage artifacts (`.spec.ts`, `.stories.ts`,
`.cy.ts`), and export it from that lib's `src/index.ts` barrel. Run the gate.

**Add a brand.** Follow `docs/THEMING.md` end to end (palette generation via
`npx nx g @angular/material:theme-color`, the two-mixin module, aggregator
registration, `ThemeBrand` union, fonts, Storybook toolbar). A complete
worked spec-kit example lives in `specs/002-exemplar-add-brand/`.

**Add a form field type.** Extend the `FormFieldType` union in
`libs/forms/src/lib/form-field.component.ts` and add a matching
`@case` branch to the `@switch (type())` blocks in
`form-field.component.html` (one switch for non-`mat-form-field` controls,
one for `matInput`-style controls). Cover the new type in the spec, story,
and cy test.

**Add a chart.** Build it as hand-written SVG in `libs/charts`.
Reuse the pure scale/tick/path/arc helpers in
`libs/charts/src/lib/internal/scale.ts` (unit-tested with exact
expectations — extend the spec if you add math) and the
`injectHostWidth()` ResizeObserver signal in
`libs/charts/src/lib/internal/host-width.ts` for viewBox width.
Series colors come only from `chartSeriesColor(i)` (cycles
`--app-chart-1..6`); grids use `--mat-sys-outline-variant`; numerals use
`--app-font-data`.

## HOW TO CONSUME

Lift the `libs/*` source into your workspace and own it — see
`docs/ADOPTION_GUIDE.md` (what to copy, tag remapping, alias renaming,
dependency reconciliation) and `docs/INTERNALIZATION_GUIDE.md` (ownership
transfer, license obligations).

**Automated path: `@m3kit/plugin` (`tools/plugin`).** The `lift` generator
downloads the repo tarball (degit-style, no git), copies the requested libs
plus their dependency closure, rewrites `@m3kit/*` to your `@<scope>/*`,
remaps project names/tags, strips demo-only targets, patches theme
`includePaths` where detectable, and prints the eslint `depConstraints` to
add (it never rewrites your eslint config). Idempotent: lifted libs are
owned and never overwritten on re-run. The plugin is **not published to
npm** (ADR-015): from this repo the generator runs directly; a consumer
workspace must first build it (`npx nx build m3kit-plugin` →
`dist/tools/plugin`) and install the output
(`pnpm add -D @m3kit/plugin@file:<m3kit>/dist/tools/plugin`).

```sh
npx nx g @m3kit/plugin:lift --libs=table,dashboard --scope=acme
# CLI shim (today): node <m3kit>/dist/tools/plugin/bin/m3kit.js add table dashboard --scope=acme
# `npx m3kit add ...` only once the package is published to npm
```

Companion scaffolds (all on-contract, all covered by devkit unit tests —
`npx nx test m3kit-plugin`): `component` (standalone/signals/OnPush, `m3k-`
selector, token-only SCSS, spec/stories/cy), `brand` (the two-mixin SCSS
pair + registration steps, applied automatically inside m3kit),
`report-page` and `dashboard-page` (app-side pages composing the kit over
TableDefinition/datasource and KPI/chart stubs). Details: `tools/plugin/
README.md`; lift exemplar spec: `specs/004-exemplar-lift/`. Demo-only and disposable: `apps/demo-reporting`
and the Storybook config under `libs/table/.storybook` — the
reusable assets are the libs themselves. After copying, re-create the theme
includePath and the boundary `depConstraints` in your own scheme, then
re-prove the boundaries with a deliberate violation.

## SPEC-KIT WORKFLOW

Features are specced through `.specify` before implementation:
constitution → `/speckit-specify` (spec.md) → `/speckit-plan` (plan.md) →
`/speckit-tasks` (tasks.md) → `/speckit-implement`. Every plan carries a
Constitution Check gate against `.specify/memory/constitution.md`. Exemplars
in `specs/`:

- `specs/001-reporting-scaffold/` — the real scaffold feature (completed;
  historical record — its paths/names predate the 2026-06-11 generalization,
  see ADR-014 in `docs/DECISIONS.md`).
- `specs/002-exemplar-add-brand/` — a worked template for the most common
  consumer task, adding a brand (status: exemplar, not pending work).
- `specs/004-exemplar-lift/` — a worked template for adopting the kit via
  the `@m3kit/plugin:lift` generator (status: exemplar, not pending work).

Mirror their structure (prioritized user stories with independent tests,
FR/SC numbering, phased tasks with done-criteria) for any new feature.
