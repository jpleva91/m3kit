# Implementation Plan: Application Shell Library (`@m3kit/shell`)

> **Historical record:** paths/names in this document predate the 2026-06-11 generalization rename (see ADR-014 in `docs/DECISIONS.md`).

**Branch**: `003-shell-lib` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-shell-lib/spec.md`

## Summary

Promote the four shell layout presets currently hard-coded in
`apps/demo-reporting/src/app/app.component.*` and
`apps/demo-reporting/src/app/core/layout-presets.ts` into `libs/reporting/shell`
(`@m3kit/shell`): an `m3k-app-shell` component driven by `preset`/`nav`/`title`
inputs with projected content and controls, plus three page scaffolding helpers
(`m3k-page-header`, `m3k-breadcrumbs`, `m3k-content-layout`). The demo app then
shrinks to a consumer of the shell, pixel-equivalent to today across all four
brands, both modes, desktop and handset. Exit criterion: full gate green
(lint/test/build + component-test including the shell + Storybook build), with
the coverage bar met for all four exported components.

## Technical Context

**Language/Version**: TypeScript 5.7.x (pinned stack); Node.js 24

**Primary Dependencies**: Angular 19.2.x, Angular Material/CDK 19.2.x,
`@ngrx/signals` 19.2.x (not used by the shell), Nx 20.8.4. **No new
dependencies** — the shell uses `@angular/router` (RouterLink/RouterLinkActive
only), `@angular/cdk/layout` (BreakpointObserver), and Material toolbar /
sidenav / list / icon / button modules, all already in the workspace.

**Storage**: N/A — chrome only; no data, no backends

**Testing**: Vitest via `@nx/vite:test` (shell target exists), Cypress
component tests via the shell's existing `component-test` target
(`skipServe: true`, `devServerTarget: demo-reporting:build`,
run with `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox`), Storybook stories
collected by the single host at `libs/reporting/material/.storybook/main.ts`
(glob must be extended to the shell lib)

**Target Platform**: Modern evergreen browsers; verified on Linux with pnpm 10

**Project Type**: Nx monorepo library feature + demo-app migration

**Performance Goals**: N/A beyond no regression — the shell renders one preset
branch at a time (`@switch`), OnPush, signals only

**Constraints**: Token-only styling (`var(--mat-sys-*)` + closed `--app-*`
contract; no raw hex, no per-brand selectors); shell depends internally on
`@m3kit/core` only (theme is styles-level); DESIGN.md binding; pixel
equivalence with the pre-migration presets; 959px handset breakpoint
preserved; clean-room logging in `docs/BOUNDARY_LOG.md`

**Scale/Scope**: 1 library populated (scaffold exists), 4 exported components
+ 2 slot directives + 3 exported types, 12 coverage artifacts, 1 app
migration, boundary + Storybook + docs wiring

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Clean-Room Integrity | Only public sources (Angular/Material/CDK/Nx docs) consulted; each consultation logged in `docs/BOUNDARY_LOG.md` at the time it happens. The preset markup/styles being promoted are repo-authored. | PASS |
| II. Source-Internalization First | Standard non-publishable Nx lib, conventional layout, no custom executors; the shell moves reusable value *out* of the disposable demo app into the copy-in surface; `docs/ADOPTION_GUIDE.md` updated. | PASS |
| III. Pinned-Stack Discipline | No version changes, no new dependencies; Angular/Material/CDK/Nx stay at the pinned lines. | PASS |
| IV. Phasing and Review Gates | Scoped to shell promotion + helpers + migration; demo-route adoption of the helpers and new presets are explicitly out of scope. | PASS |
| V. Synthetic Data Only | Stories/specs/CT use synthetic nav destinations and neutral copy from approved domains; no real data. | PASS |
| VI. Boundary-Log Duties | Boundary-violation proof for the new `scope:reporting-shell` constraints recorded in `docs/BOUNDARY_LOG.md`; ADR added to `docs/DECISIONS.md`. | PASS |
| VII. Simplicity Bias | Four presets as shipped, no speculative configuration knobs; slot fallback (rail-footer → toolbar-actions) is the only convenience; types over abstraction. | PASS |

No violations; the Complexity Tracking section is empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-shell-lib/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
libs/reporting/shell/                  # EXISTS as scaffold; this feature populates it
├── src/
│   ├── index.ts                       # Barrel: components, slot directives, types
│   └── lib/
│       ├── app-shell/
│       │   ├── app-shell.component.ts        # m3k-app-shell (preset/nav/title)
│       │   ├── app-shell.component.html      # @switch over the four presets
│       │   ├── app-shell.component.scss      # token-only, promoted from app.component.scss
│       │   ├── app-shell.component.spec.ts
│       │   ├── app-shell.component.stories.ts
│       │   ├── app-shell.component.cy.ts
│       │   ├── shell-slots.ts                # ShellToolbarActionsDirective, ShellRailFooterDirective
│       │   └── shell-model.ts                # ShellPreset, ShellNavItem
│       ├── page-header/
│       │   └── page-header.component.{ts,html,scss,spec.ts,stories.ts,cy.ts}   # m3k-page-header
│       ├── breadcrumbs/
│       │   ├── breadcrumbs.component.{ts,html,scss,spec.ts,stories.ts,cy.ts}   # m3k-breadcrumbs
│       │   └── breadcrumb-item.ts             # BreadcrumbItem
│       └── content-layout/
│           └── content-layout.component.{ts,html,scss,spec.ts,stories.ts,cy.ts} # m3k-content-layout
├── cypress/ …                          # CT support (exists)
├── cypress.config.ts                   # exists (skipServe, demo-reporting:build)
├── project.json                        # exists; prefix corrected to "m3k"
└── vite.config.mts                     # exists

apps/demo-reporting/src/app/
├── app.component.ts                    # SHRINKS: ThemeService, brands, navLinks, preset computed
├── app.component.html                  # SHRINKS: <m3k-app-shell> + projected controls + <router-outlet/>
├── app.component.scss                  # SHRINKS: host sizing only (or empty)
└── core/layout-presets.ts              # KEEPS brand→preset map; LayoutPreset re-typed as ShellPreset

eslint.config.mjs                       # + scope:reporting-shell constraint; + shell in type:app list
libs/reporting/material/.storybook/main.ts   # + shell stories glob
AGENTS.md / README.md / docs/…          # graph, inventory, ADR, adoption updates
```

**Structure Decision**: The scaffolded `libs/reporting/shell` (alias
`@m3kit/shell`, tags `type:lib, scope:reporting-shell`, Vitest + Cypress CT
targets already configured) is populated in place; its generated
`reporting-shell` placeholder component is deleted. One directory per exported
component, all three coverage artifacts beside each component, following the
`libs/reporting/dashboard` pattern (standalone, signal `input()`/`computed()`,
OnPush, `m3k-` selector prefix, token-only `.scss`).

### Module Boundaries

New depConstraint in the root `eslint.config.mjs` (and the shell scope added
to the `type:app` allow-list):

```js
{
  sourceTag: 'scope:reporting-shell',
  onlyDependOnLibsWithTags: [
    'scope:reporting-core',
    'scope:reporting-theme',   // styles-level only, mirroring sibling libs
  ],
},
```

`type:app` gains `'scope:reporting-shell'`. All other internal directions
involving the shell (shell → material/charts/dashboard/forms/testing, any lib
→ shell) remain lint errors — no permissive catch-all. Verification: add a
deliberate `@m3kit/material` import inside the shell, confirm
`nx lint reporting-shell` fails with a module-boundary error, revert, record
in `docs/BOUNDARY_LOG.md`.

Note: the shell currently needs nothing from `@m3kit/core` at runtime — the
constraint is the permitted ceiling, matching the feature contract "shell
imports only `@m3kit/core`".

### API Design (key decisions)

**`m3k-app-shell`** — the shell owns 100% of the chrome; the consumer owns
routing and policy.

- Inputs (signal-based):
  - `preset = input<ShellPreset>('sidenav')` where
    `type ShellPreset = 'sidenav' | 'command-bar' | 'contents-rail' | 'pill-tabs'`
  - `nav = input<readonly ShellNavItem[]>([])` where
    `interface ShellNavItem { path: string; label: string; icon?: string; exact?: boolean }`
    (`icon` used only by icon-bearing presets; `exact` defaults `false` via
    `link.exact ?? false` in the active-options binding)
  - `title = input<string>('')`
- **Main content: default `<ng-content />`.** The consumer projects
  `<router-outlet />` (plus anything else) as the element's children. The
  shell does NOT import `RouterOutlet` and never owns routes — this keeps the
  lib free of routing policy and lets CT/stories mount it with plain
  placeholder content. Each `@switch` branch contains one default
  `<ng-content />`; exactly one branch is live at a time.
- **Toolbar actions / rail footer: structural-directive template slots, not
  `ng-content`.** `ng-content` cannot be stamped in more than one position,
  but the controls position varies per preset (toolbar end for
  `sidenav`/`pill-tabs`, bordered cell for `command-bar`, rail foot for
  `contents-rail`). The shell therefore captures consumer templates via
  `contentChild()` and stamps them with `NgTemplateOutlet` exactly where each
  preset needs them — the same `ng-template`/`ngTemplateOutlet` mechanism the
  app uses internally today for `toolbarControls`, promoted into the API:
  - `*m3kShellToolbarActions` → `ShellToolbarActionsDirective`
  - `*m3kShellRailFooter` (optional) → `ShellRailFooterDirective`;
    `contents-rail` stamps it in the rail foot, falling back to the
    toolbar-actions template when absent
- Responsiveness: `isHandset` from `BreakpointObserver` on
  `'(max-width: 959px)'` via `toSignal` — promoted verbatim from the app so
  behavior is identical. `sidenav`/`contents-rail` switch `mat-sidenav` to
  `mode="over"`, closed by default, hamburger toggle, close-on-navigate;
  `command-bar`/`pill-tabs` wrap via the existing media query, moved into the
  shell stylesheet unchanged.
- Template/styles: the four `@case` branches and the preset stylesheet
  sections move from `app.component.html`/`.scss` essentially verbatim
  (selector renames only: `app-*` class names stay as-is to minimize diff
  risk to pixel parity). Token-only audit re-run after the move.

**`m3k-page-header`** — `title = input.required<string>()` rendered as the
component's single `h1` in the brand display token
(`font: var(--mat-sys-display-small)` family per DESIGN.md);
`subtitle = input<string>('')` in `--mat-sys-on-surface-variant`; actions via
`<ng-content select="[m3kPageHeaderActions]" />` (attribute-selected
`ng-content` suffices here — single stamp position).

**`m3k-breadcrumbs`** — `items = input<readonly BreadcrumbItem[]>([])` with
`interface BreadcrumbItem { label: string; path?: string }`. Renders
`<nav aria-label="Breadcrumb"><ol>…</ol></nav>`; items with `path` (all but
last) are `routerLink` anchors, the last renders as text with
`aria-current="page"`; separators are `aria-hidden="true"` pseudo/spans.

**`m3k-content-layout`** — `mode = input<ContentLayoutMode>('full')` with
`type ContentLayoutMode = 'full' | 'centered' | 'split'`. `full`: fluid
width; `centered`: centered column constrained to a readable max width;
`split`: CSS grid of default `<ng-content />` (primary) +
`<ng-content select="[m3kContentAside]" />` (aside), stacking to one column
at ≤959px.

**Demo app after migration** (the API sufficiency proof):

```html
<m3k-app-shell [preset]="layoutPreset()" [nav]="navLinks" [title]="title">
  <ng-template m3kShellToolbarActions>
    <!-- brand menu + dark-mode toggle (app policy, unchanged markup) -->
  </ng-template>
  <router-outlet />
</m3k-app-shell>
```

`core/layout-presets.ts` keeps `BRAND_LAYOUT_PRESETS` but types it
`Record<ThemeBrand, ShellPreset>` (importing `ShellPreset` from
`@m3kit/shell`); `NavLink` is replaced by `ShellNavItem`. The brand-switcher
markup/styles for the menu move nowhere — they were already preset-agnostic.

### Tooling / Wiring Decisions

- **Storybook**: add
  `'../../shell/src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'` to the host glob in
  `libs/reporting/material/.storybook/main.ts`. Shell stories provide a
  router via `applicationConfig` + `provideRouter([],
  withDisabledInitialNavigation())` (the app story already proves this
  pattern).
- **Cypress CT**: the shell's `component-test` target exists; `*.cy.ts` mount
  with `cy.mount` + router providers, asserting per-preset chrome, slot
  stamping, and handset behavior via `cy.viewport`.
- **Vitest specs**: TestBed-mounted host components exercising preset
  switching, nav rendering, `aria-current`, slot fallback, and the
  breakpoint signal (mocked `BreakpointObserver`).
- **Shell project prefix**: correct `project.json` `"prefix": "lib"` →
  `"m3k"` so generated/linted selectors match the kit convention.
- **App coverage**: `app.component.spec.ts` and `.stories.ts` are updated to
  the migrated template and must keep passing (the story's
  `withDisabledInitialNavigation` pattern is preserved).

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Pixel drift during promotion — "while we're here" style cleanups break brand parity. | Move template/styles verbatim; keep class names and the 959px query identical; per-brand × per-mode × per-width inspection checklist in US2; DESIGN.md QA pass. |
| Projection pitfalls — `ng-content` in `@switch` branches or template slots behaving unexpectedly across preset switches. | Default slot appears once per branch (one live at a time); movable chrome uses `ng-template` + `NgTemplateOutlet` (the already-proven in-app pattern); CT covers runtime preset switching explicitly. |
| Boundary leakage — shell quietly importing material/forms/etc., or the app keeping dead layout code. | New `scope:reporting-shell` constraint with deliberate-violation proof logged in `BOUNDARY_LOG.md`; US2 done-criteria include grep-level absence of preset markup/styles in the app. |
| Coverage-bar shortcuts — components land without one of the three artifacts. | Tasks list all 12 artifacts explicitly; SC-004 counts 4/4 components × 3 artifacts; the gate includes `component-test` and `build-storybook`. |
| CT/Storybook router friction — RouterLink in a mounted component without a router. | Provide `provideRouter` in every story/CT mount; pattern proven by the existing app story; no `RouterOutlet` inside the shell keeps mounts simple. |
| Demo app spec/story breakage post-migration. | Treat app spec/story updates as in-scope tasks with the same template assertions re-pointed at the shell's rendered output. |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations — nothing to track.
