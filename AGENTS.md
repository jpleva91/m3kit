# AGENTS.md — operating manual for AI agents

How to consume or extend m3kit. Terse, factual, command-accurate. The project
constitution (`.specify/memory/constitution.md`) supersedes everything here.

## What this is

m3kit is a clean-room, rethemable Material 3 UI component kit — an Angular
19 / Nx 20 reference monorepo demonstrated through a generic enterprise
reporting domain (report tables, dashboards, charts, typed filter forms) with
synthetic data only. It is a **reference to be read and copied, not a
dependency to be installed**: nothing is published to npm; consumers
source-internalize `libs/reporting/*` into their own workspaces. Components
consume design tokens only, so brands are pure token re-emissions and the
entire kit reskins (four demo brands, each light + dark) without touching
component code.

## Library graph and boundaries

| Project | Alias | May depend on (internal) |
|---|---|---|
| `libs/reporting/core` | `@m3kit/core` | nothing |
| `libs/reporting/theme` | none (SCSS-only) | nothing |
| `libs/reporting/material` | `@m3kit/material` | core, theme |
| `libs/reporting/testing` | `@m3kit/testing` | core, theme |
| `libs/reporting/dashboard` | `@m3kit/dashboard` | core, theme |
| `libs/reporting/charts` | `@m3kit/charts` | core, theme |
| `libs/reporting/forms` | `@m3kit/forms` | core, theme |
| `apps/demo-reporting` | — | all of the above |

Rules are machine-enforced by `@nx/enforce-module-boundaries` in the root
`eslint.config.mjs` (no permissive catch-all — any other direction fails
lint). **Do not fight the boundaries; code that needs a forbidden edge is
wrong by definition.** `theme` sits outside the TypeScript graph: it has no
tsconfig alias and is resolved via `stylePreprocessorOptions.includePaths:
["libs/reporting/theme/src"]` (set on the app's `build` target and the
`reporting-material` Storybook targets) as `@use 'm3kit-theme'`.

Component inventory (exported barrels, `libs/reporting/*/src/index.ts`):
core — models, query engine, datasource interfaces, in-memory datasource;
material — `report-table`, `report-filter-bar`, `report-toolbar`;
dashboard — `dashboard-grid`, `kpi-card`, `kpi-strip`, `detail-card`;
charts — `line-chart`, `bar-chart`, `donut-chart`, `chart-legend`,
`chart-card`; forms — `form-field`, `form-section`, `filter-form`;
testing — `seeded-random`, factories, report definitions.

## THE CONTRACT (binding)

1. **Token-only styling.** Component stylesheets consume `var(--mat-sys-*)`
   (M3 system tokens) and the `--app-*` contract defined in
   `libs/reporting/theme/src/m3kit-theme/_contract.scss` — nothing else. The
   contract is closed: `--app-status-{draft,sent,paid,overdue,void}-{bg,fg}`,
   `--app-radius-{card,control,badge}`, `--app-font-data`,
   `--app-chart-1..6`. No raw hex in components, no per-brand selectors
   (`html.theme-x .component` is forbidden). If a brand seems to need an
   escape hatch, the contract needs a new token — a documented decision.
2. **DESIGN.md is binding.** Read it before any visual decision: fonts,
   color, density splits, spacing, radii, motion, anti-patterns. Do not
   deviate without explicit user approval.
3. **No chart or UI library dependencies.** Charts are hand-built SVG; the
   dependency surface is Angular + Material/CDK + `@ngrx/signals`, period.
   Any new dependency requires justification in `docs/DECISIONS.md`.
4. **Synthetic data only.** Approved domains: customers, orders, invoices,
   support tickets, products. All data comes from `libs/reporting/testing`
   factories or repo-authored static JSON. No real data, no backends, no
   network sources.
5. **Clean-room rules.** Public sources only; log every external consultation
   in `docs/BOUNDARY_LOG.md` at the time it happens. Doubt resolves to
   exclusion.

## THE COVERAGE BAR

Every exported component ships three artifacts beside it in `src/lib/`:

- `*.spec.ts` — Vitest unit spec (`@nx/vite:test`)
- `*.stories.ts` — Storybook story (collected by the single Storybook host,
  `libs/reporting/material/.storybook/main.ts`, which globs material, charts,
  dashboard, forms, and the demo app)
- `*.cy.ts` — Cypress component test (`component-test` target on material,
  charts, dashboard, forms)

Commands (verified against `project.json` targets):

```sh
npx nx test <project>                  # e.g. nx test reporting-dashboard
npx nx lint <project>
npx nx build demo-reporting            # libs are non-buildable by design
ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run <project>:component-test
npx nx run reporting-material:storybook        # dev server, port 4400
npx nx run reporting-material:build-storybook  # must compile clean
npx nx serve demo-reporting            # http://localhost:4200
```

The full gate (run before claiming any work done):

```sh
npx nx run-many -t lint test build \
  && ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run-many -t component-test \
  && npx nx run reporting-material:build-storybook
```

## HOW TO

**Add a component.** Follow the existing patterns in
`libs/reporting/dashboard/src/lib` (e.g. `kpi-card.component.ts`): standalone
component, signal `input()`/`computed()`, `ChangeDetectionStrategy.OnPush`,
`rpt-` selector prefix, token-only `.scss`. Place it in the lib whose
boundary it fits, add all three coverage artifacts (`.spec.ts`, `.stories.ts`,
`.cy.ts`), and export it from that lib's `src/index.ts` barrel. Run the gate.

**Add a brand.** Follow `docs/THEMING.md` end to end (palette generation via
`npx nx g @angular/material:theme-color`, the two-mixin module, aggregator
registration, `ThemeBrand` union, fonts, Storybook toolbar). A complete
worked spec-kit example lives in `specs/002-exemplar-add-brand/`.

**Add a form field type.** Extend the `FormFieldType` union in
`libs/reporting/forms/src/lib/form-field.component.ts` and add a matching
`@case` branch to the `@switch (type())` blocks in
`form-field.component.html` (one switch for non-`mat-form-field` controls,
one for `matInput`-style controls). Cover the new type in the spec, story,
and cy test.

**Add a chart.** Build it as hand-written SVG in `libs/reporting/charts`.
Reuse the pure scale/tick/path/arc helpers in
`libs/reporting/charts/src/lib/internal/scale.ts` (unit-tested with exact
expectations — extend the spec if you add math) and the
`injectHostWidth()` ResizeObserver signal in
`libs/reporting/charts/src/lib/internal/host-width.ts` for viewBox width.
Series colors come only from `chartSeriesColor(i)` (cycles
`--app-chart-1..6`); grids use `--mat-sys-outline-variant`; numerals use
`--app-font-data`.

## HOW TO CONSUME

Lift the `libs/reporting/*` source into your workspace and own it — see
`docs/ADOPTION_GUIDE.md` (what to copy, tag remapping, alias renaming,
dependency reconciliation) and `docs/INTERNALIZATION_GUIDE.md` (ownership
transfer, license obligations). Demo-only and disposable: `apps/demo-reporting`
and the Storybook config under `libs/reporting/material/.storybook` — the
reusable assets are the libs themselves. After copying, re-create the theme
includePath and the boundary `depConstraints` in your own scheme, then
re-prove the boundaries with a deliberate violation.

## SPEC-KIT WORKFLOW

Features are specced through `.specify` before implementation:
constitution → `/speckit-specify` (spec.md) → `/speckit-plan` (plan.md) →
`/speckit-tasks` (tasks.md) → `/speckit-implement`. Every plan carries a
Constitution Check gate against `.specify/memory/constitution.md`. Exemplars
in `specs/`:

- `specs/001-reporting-scaffold/` — the real scaffold feature (completed).
- `specs/002-exemplar-add-brand/` — a worked template for the most common
  consumer task, adding a brand (status: exemplar, not pending work).

Mirror their structure (prioritized user stories with independent tests,
FR/SC numbering, phased tasks with done-criteria) for any new feature.
