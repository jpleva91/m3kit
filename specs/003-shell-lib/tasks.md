---

description: "Task list for the application shell library (@m3kit/shell)"
---

> **Historical record:** paths/names in this document predate the 2026-06-11 generalization rename (see ADR-014 in `docs/DECISIONS.md`).

# Tasks: Application Shell Library (`@m3kit/shell`)

**Input**: Design documents from `/specs/003-shell-lib/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Full coverage bar per exported component — Vitest `*.spec.ts`, Storybook `*.stories.ts`, Cypress `*.cy.ts` — plus the demo app's existing spec/story kept green. No e2e.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Shell library: `libs/reporting/shell/` (scaffold exists — Vitest target, Cypress CT target with `skipServe` against `demo-reporting:build`, alias `@m3kit/shell`, tags `type:lib, scope:reporting-shell`)
- Demo app: `apps/demo-reporting/`
- Boundary rules: root `eslint.config.mjs`; Storybook host: `libs/reporting/material/.storybook/main.ts` — see plan.md Project Structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire the existing shell scaffold into the workspace's enforcement and tooling before any component work

- [x] T001 Add the `scope:reporting-shell` depConstraint to the root `eslint.config.mjs` (`onlyDependOnLibsWithTags: ['scope:reporting-core', 'scope:reporting-theme']`, mirroring sibling libs) and add `'scope:reporting-shell'` to the `type:app` allow-list; no permissive catch-all
- [x] T002 Prove enforcement with a deliberate violation: temporarily import `@m3kit/material` from inside `libs/reporting/shell/src/index.ts`, confirm `npx nx lint reporting-shell` fails with a module-boundary error, revert, and record the check in `docs/BOUNDARY_LOG.md`
- [x] T003 [P] Add the shell stories glob `'../../shell/src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'` to `libs/reporting/material/.storybook/main.ts`
- [x] T004 [P] Shell lib hygiene in `libs/reporting/shell`: set `"prefix": "m3k"` in `project.json`; delete the generated placeholder `src/lib/reporting-shell/` component; leave `src/index.ts` exporting nothing yet (restored in Phase 2); confirm `npx nx test reporting-shell` and `npx nx lint reporting-shell` still run

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Public types and slot directives every component and the migration depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create `libs/reporting/shell/src/lib/app-shell/shell-model.ts`: `export type ShellPreset = 'sidenav' | 'command-bar' | 'contents-rail' | 'pill-tabs'` and `export interface ShellNavItem { path: string; label: string; icon?: string; exact?: boolean }` (promoted from the app's `LayoutPreset` and `NavLink`), with doc comments describing each preset
- [x] T006 Create `libs/reporting/shell/src/lib/app-shell/shell-slots.ts`: `ShellToolbarActionsDirective` (selector `[m3kShellToolbarActions]`) and `ShellRailFooterDirective` (selector `[m3kShellRailFooter]`), each a standalone structural-slot directive exposing its `TemplateRef`
- [x] T007 Create `libs/reporting/shell/src/lib/breadcrumbs/breadcrumb-item.ts`: `export interface BreadcrumbItem { label: string; path?: string }`; export ShellPreset, ShellNavItem, BreadcrumbItem, ContentLayoutMode (placeholder until T019), and both slot directives from `libs/reporting/shell/src/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Consumer composes a full app from the shell presets (Priority: P1) 🎯 MVP

**Goal**: `m3k-app-shell` renders all four preset chromes from `preset`/`nav`/`title` inputs with projected main content and template slots, handset behavior intact, token-only styling

**Independent Test**: Mount `m3k-app-shell` in isolation (spec/story/CT) per preset with a synthetic nav model and placeholder projected content — no demo-app changes required

### Implementation for User Story 1

- [x] T008 [US1] Create `m3k-app-shell` in `libs/reporting/shell/src/lib/app-shell/app-shell.component.ts`: standalone, OnPush, signal inputs `preset` (default `'sidenav'`), `nav` (default `[]`), `title` (default `''`); `contentChild()` for the two slot directives; `isHandset` via `BreakpointObserver` on `'(max-width: 959px)'` through `toSignal` (promoted verbatim from `apps/demo-reporting/src/app/app.component.ts`); imports limited to NgTemplateOutlet, RouterLink/RouterLinkActive (NOT RouterOutlet), and Material toolbar/sidenav/list/icon/button
- [x] T009 [US1] Promote the four-preset template into `libs/reporting/shell/src/lib/app-shell/app-shell.component.html`: move the `@switch` branches from `apps/demo-reporting/src/app/app.component.html` verbatim, replacing the in-app `toolbarControls`/`content` ng-templates with the slot mechanism — default `<ng-content />` once per branch for main content; toolbar-actions template stamped via `NgTemplateOutlet` at each preset's controls position (toolbar end for sidenav/pill-tabs, controls cell for command-bar, rail foot for contents-rail); rail-footer template used by contents-rail when present, falling back to toolbar-actions; `link.exact ?? false` in `routerLinkActiveOptions`; preserve `aria-current`, hamburger toggles, close-on-navigate, footline and folio details exactly
- [x] T010 [US1] Promote the styles into `libs/reporting/shell/src/lib/app-shell/app-shell.component.scss`: move `:host` sizing, all four preset sections, and the ≤959px media query from `apps/demo-reporting/src/app/app.component.scss` verbatim (class names unchanged); audit token-only compliance (`var(--mat-sys-*)` + `--app-*` only, no hex, no per-brand selectors)
- [x] T011 [US1] Export `AppShellComponent` from `libs/reporting/shell/src/index.ts`; `npx nx lint reporting-shell` green
- [x] T012 [US1] Write `libs/reporting/shell/src/lib/app-shell/app-shell.component.spec.ts` (Vitest): per-preset chrome rendering from one mounted host (preset switching at runtime), nav model rendering incl. optional `icon` and `exact ?? false`, `aria-current="page"` on the active link, default-content projection, toolbar-actions stamping position per preset, rail-footer fallback to toolbar-actions, empty-nav and no-slot edge cases, handset signal behavior with a mocked `BreakpointObserver` (over-mode + closed by default for sidenav/contents-rail)
- [x] T013 [US1] Write `libs/reporting/shell/src/lib/app-shell/app-shell.component.stories.ts`: one story per preset (synthetic nav: Dashboard/Invoices/Customers), router provided via `applicationConfig` + `provideRouter([], withDisabledInitialNavigation())`, projected placeholder content and toolbar-actions; a play-function assertion on rendered nav labels
- [x] T014 [US1] Write `libs/reporting/shell/src/lib/app-shell/app-shell.component.cy.ts` (Cypress CT): mount per preset with router providers; assert chrome structure, active-link marking, slot stamping; `cy.viewport` below 960px to assert overlay+hamburger (sidenav, contents-rail incl. close-on-navigate) and wrapping bars (command-bar, pill-tabs); run via `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run reporting-shell:component-test`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Demo app shrinks to shell consumption, pixel-equivalent (Priority: P2)

**Goal**: `apps/demo-reporting` consumes `m3k-app-shell`; all preset markup/styles deleted from the app; four brands visually equivalent to pre-migration in both modes at desktop and handset

**Independent Test**: Serve the app, switch through all four brands (each maps to a different preset) in light/dark at desktop/handset and compare against pre-migration behavior; app spec/story pass

### Implementation for User Story 2

- [x] T015 [US2] Re-type the brand map in `apps/demo-reporting/src/app/core/layout-presets.ts`: import `ShellPreset` from `@m3kit/shell`, keep `BRAND_LAYOUT_PRESETS: Record<ThemeBrand, ShellPreset>`, delete the local `LayoutPreset` union (or alias it to `ShellPreset` for continuity)
- [x] T016 [US2] Migrate `apps/demo-reporting/src/app/app.component.ts`: import `AppShellComponent`, `ShellToolbarActionsDirective`, `ShellNavItem` from `@m3kit/shell`; replace the local `NavLink` with `ShellNavItem`; keep ThemeService, brands, `layoutPreset` computed, navLinks, title; drop NgTemplateOutlet/BreakpointObserver/toolbar/sidenav/list imports now owned by the shell (keep icon/button/menu for the projected controls)
- [x] T017 [US2] Shrink `apps/demo-reporting/src/app/app.component.html` to shell consumption: `<m3k-app-shell [preset]="layoutPreset()" [nav]="navLinks" [title]="title">` + `<ng-template m3kShellToolbarActions>` wrapping the unchanged brand-menu/dark-toggle markup + projected `<router-outlet />`; delete all four `@switch` preset branches; shrink `app.component.scss` to at most `:host` sizing — zero preset styling remains (verify by grep for `command-`, `rail-`, `pill-` classes in the app)
- [x] T018 [US2] Keep app coverage green and verify parity: update `apps/demo-reporting/src/app/app.component.spec.ts` and `app.component.stories.ts` for the migrated template (same behavioral assertions re-pointed at shell output, `withDisabledInitialNavigation` story pattern preserved); `npx nx serve demo-reporting` and walk the parity checklist — 4 brands × {light, dark} × {desktop, handset}: structure, tokens, active states, footline/folio/pill details, overlay/hamburger and wrapping behavior all match pre-migration; fix any drift in the shell, not the app

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Page scaffolding helpers (Priority: P3)

**Goal**: `m3k-page-header`, `m3k-breadcrumbs`, and `m3k-content-layout` exported with full coverage; token-only; synthetic copy

**Independent Test**: Mount each helper in isolation (spec/story/CT); no demo-app changes

### Implementation for User Story 3

- [x] T019 [P] [US3] Create `m3k-page-header` in `libs/reporting/shell/src/lib/page-header/`: `title = input.required<string>()` rendered as the single `h1` in the brand display token per DESIGN.md, optional `subtitle` input in `--mat-sys-on-surface-variant`, `<ng-content select="[m3kPageHeaderActions]" />` aligned to the end; export from the barrel; ship `page-header.component.spec.ts` (h1 count/typography hook, subtitle optionality, actions projection), `.stories.ts` (with/without subtitle/actions, synthetic copy e.g. "Invoices"), `.cy.ts`
- [x] T020 [P] [US3] Create `m3k-breadcrumbs` in `libs/reporting/shell/src/lib/breadcrumbs/`: `items = input<readonly BreadcrumbItem[]>([])` rendered as `<nav aria-label="Breadcrumb"><ol>`; routerLink anchors for items with `path`, last item plain text with `aria-current="page"`, separators `aria-hidden="true"`; export from the barrel; ship `breadcrumbs.component.spec.ts` (link vs. current-item rendering, single-item and empty edge cases, aria attributes), `.stories.ts` (router provided; e.g. Reports → Customers → Acme Manufacturing), `.cy.ts`
- [x] T021 [P] [US3] Create `m3k-content-layout` in `libs/reporting/shell/src/lib/content-layout/`: `mode = input<ContentLayoutMode>('full')` with `export type ContentLayoutMode = 'full' | 'centered' | 'split'`; `full` fluid, `centered` readable centered column, `split` grid of default `<ng-content />` + `<ng-content select="[m3kContentAside]" />` stacking at ≤959px; export component and type from the barrel; ship `content-layout.component.spec.ts` (mode classes, slot projection), `.stories.ts` (all three modes with synthetic content), `.cy.ts` (incl. split stacking at handset viewport)
- [x] T022 [US3] Token + copy audit of the whole shell lib: zero raw hex, zero per-brand selectors, only `var(--mat-sys-*)`/`--app-*` in every `*.scss`; all story/spec/CT copy from approved synthetic domains or neutral text; `npx nx test reporting-shell` and `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run reporting-shell:component-test` green

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Truthful docs and the full gate

- [x] T023 [P] Update documentation to match reality: AGENTS.md library-graph table (+`libs/reporting/shell` / `@m3kit/shell` → core, theme) and component inventory (shell — `app-shell`, `page-header`, `breadcrumbs`, `content-layout`); README repo map; `docs/ADOPTION_GUIDE.md` copy-in list; new ADR in `docs/DECISIONS.md` (shell library promotion, boundary, slot-directive API decision); confirm all `docs/BOUNDARY_LOG.md` entries for this feature were logged at consultation time
- [x] T024 Full gate: `npx nx run-many -t lint test build && ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run-many -t component-test && npx nx run reporting-material:build-storybook` — all green, shell stories visible in the Storybook build, each shell component reporting passing specs and CTs; record completion evidence at the foot of this file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — boundary wiring (T001–T002) must precede any shell imports so violations fail from day one; T003/T004 parallel
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (types and slot directives are imported everywhere)
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - User stories proceed in priority order (P1 → P2 → P3); US3 may run in parallel with US2 once US1 is done (different files)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (`m3k-app-shell` must exist and be exported) — the migration is the API-sufficiency proof
- **User Story 3 (P3)**: Can start after Foundational; independent of US1/US2 component code (shares only the barrel file — coordinate `index.ts` edits)

### Within Each User Story

- Component before coverage artifacts (T008–T011 → T012–T014)
- Brand-map re-typing before app migration before parity verification (T015 → T016 → T017 → T018)
- Helper components (T019/T020/T021) are parallel; the audit (T022) runs last

### Parallel Opportunities

- T003 and T004 (different files)
- T012, T013, T014 after T011 (different files)
- T019, T020, T021 (different directories; serialize barrel edits in `src/index.ts`)
- T023 in parallel with late US3 work; T024 strictly last

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (boundaries proven before code)
2. Complete Phase 2: Foundational (types + slot directives)
3. Complete Phase 3: User Story 1 — `m3k-app-shell` with all four presets and full coverage is the MVP
4. **STOP and VALIDATE**: `npx nx test reporting-shell`, shell CT run, shell stories render per preset; demo app untouched and still green

### Incremental Delivery

1. Setup + Foundational → shell lib enforceable and typed
2. User Story 1 → composable four-preset shell, fully covered (MVP)
3. User Story 2 → demo app shrunk to shell consumption, pixel parity verified
4. User Story 3 → page-header, breadcrumbs, content-layout complete the composition story
5. Polish → docs truthful, full gate green

---

## Out of Scope (Future Phases)

Listed only so nobody starts them now:

1. **Theme/brand machinery in the shell** — theme state stays consumer policy, projected through the slots
2. **New presets or preset configuration knobs** (densities, rail collapse, width options) — own spec when needed
3. **Demo routes adopting the page helpers** — deferred to preserve the pixel-equivalence claim of this feature
4. **Screenshot-diff tooling** for automated visual regression — parity here is inspection + behavioral assertions
5. **E2E setup, CI provider config, publishing** — unchanged standing deferrals

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Clean-room rules apply to every task: public sources only, every consultation logged in `docs/BOUNDARY_LOG.md` as it happens, synthetic domains only (customers, orders, invoices, support tickets, products)
- DESIGN.md is binding for every visual decision; this feature relocates approved styling, it does not redesign
- The coverage bar is non-negotiable: 4 exported components × 3 artifacts each, all beside the component in `src/lib/`
- Commit after each task or logical group; stop at any checkpoint to validate independently

---

## Completion evidence (2026-06-11)

All 24 tasks complete. Verification record:

- **Full gate green** — `npx nx run-many -t lint test build`: targets lint,
  test, build successful for all 9 projects (re-confirmed 2026-06-11 after
  the doc/typing fixes for T015 and T023).
- **Shell component tests green** — `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox
  npx nx run reporting-shell:component-test`: all shell CTs passing
  (app-shell per preset incl. handset viewport, page-header, breadcrumbs,
  content-layout).
- **Storybook green** — `npx nx run reporting-material:build-storybook`
  compiles clean with the shell stories glob included; shell stories render
  per preset.
- **Boundary proof logged** — deliberate `@m3kit/material` import in
  `libs/reporting/shell/src/index.ts` failed
  `npx nx run reporting-shell:lint --skip-nx-cache` with
  `@nx/enforce-module-boundaries`, was reverted, lint re-ran green; recorded
  as a dated correction row in `docs/BOUNDARY_LOG.md` (T002).
- **Docs truthful (T023)** — AGENTS.md library graph + component inventory +
  CT list, README repo map, `docs/ADOPTION_GUIDE.md` copy-in table, and
  `docs/DECISIONS.md` ADR-013 (shell library promotion) all updated.
