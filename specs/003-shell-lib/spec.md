# Feature Specification: Application Shell Library (`@m3kit/shell`)

> **Historical record:** paths/names in this document predate the 2026-06-11 generalization rename (see ADR-014 in `docs/DECISIONS.md`).

**Feature Branch**: `003-shell-lib`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Promote the four shell layout presets living in
the demo app today (`apps/demo-reporting/src/app/app.component.*` +
`core/layout-presets.ts`) into a new `libs/reporting/shell` library
(`@m3kit/shell`) so consumers can compose full applications from the kit:
a preset-driven app shell, a page header, breadcrumbs, and content-layout
width helpers. The demo app becomes a consumer of the shell. Token-only
styling, shell depends internally on `@m3kit/core` only, full coverage bar
(spec + story + CT) per exported component, gate stays green."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consumer composes a full app from the shell presets (Priority: P1)

As a reference consumer (an enterprise Angular team building an internal app
from the kit), I can import `m3k-app-shell` from `@m3kit/shell`, hand it a
navigation model, a title, and one of four layout presets — `sidenav`,
`command-bar`, `contents-rail`, `pill-tabs` — and project my routed content
and toolbar controls into it, so I get a complete, branded application chrome
without copying layout code out of the demo app.

**Why this priority**: The shell is the missing top of the composition stack.
Today the kit ships tables, charts, dashboards, and forms, but the chrome that
binds them into an application is trapped in `apps/demo-reporting` — which is
documented as disposable. Until the presets live in a lib, "consumers compose
full apps" is not true.

**Independent Test**: Can be fully tested by mounting `m3k-app-shell` in
isolation (Vitest, Storybook, Cypress CT) with each of the four preset values,
a synthetic nav model, and projected placeholder content — without the demo
app being migrated at all.

**Acceptance Scenarios**:

1. **Given** `m3k-app-shell` with `preset="sidenav"`, a three-item nav model,
   and a title, **When** it renders at desktop width, **Then** a Material
   toolbar and a docked side navigation render, every nav item appears as a
   list row with its icon and label, the active route is marked
   (`aria-current="page"`), and the projected content renders in the content
   area.
2. **Given** the same component, **When** `preset` is switched to
   `command-bar`, `contents-rail`, or `pill-tabs`, **Then** the shell
   re-renders the matching chrome (single top bar with inline nav and status
   footline; editorial left rail with folio-numbered contents nav; toolbar
   with centered pill tab nav respectively) with the same nav model and the
   same projected content — no consumer template change beyond the input.
3. **Given** any preset, **When** the consumer projects toolbar controls into
   the toolbar-actions slot, **Then** the shell stamps those controls in the
   preset-appropriate position (toolbar end for `sidenav`/`pill-tabs`,
   bordered controls cell for `command-bar`, rail foot for `contents-rail`),
   and for `contents-rail` an optional rail-footer slot overrides that
   placement.
4. **Given** the `sidenav` or `contents-rail` preset at handset width
   (≤959px), **When** the shell renders, **Then** the side navigation becomes
   an overlay, closed by default, with a hamburger toggle button, and
   activating a nav link closes the overlay.
5. **Given** the `command-bar` or `pill-tabs` preset at handset width,
   **When** the shell renders, **Then** the bars wrap instead of overflowing
   and the projected controls remain reachable, matching the demo app's
   current handset behavior.
6. **Given** the shell's stylesheet, **When** it is audited, **Then** it
   consumes only `var(--mat-sys-*)` system tokens and the closed `--app-*`
   contract — no raw hex, no per-brand selectors — so every preset reskins
   under all four brands, light and dark, with zero shell code changes.

---

### User Story 2 - Demo app shrinks to shell consumption, pixel-equivalent (Priority: P2)

As a maintainer of the reference, I migrate `apps/demo-reporting` to consume
`m3k-app-shell`, so the demo proves the shell's public API is sufficient for a
real application and the app stops carrying ~530 lines of layout template and
stylesheet that belong in a lib.

**Why this priority**: The migration is the proof of the extraction. If the
demo cannot express its current four-brand chrome purely through the shell's
inputs and slots, the API is wrong. It depends on User Story 1 existing but is
independently verifiable.

**Independent Test**: Can be fully tested by serving the demo app across all
four brands (each brand maps to a different preset) in light and dark, at
desktop and handset widths, and comparing against pre-migration behavior;
plus the existing app spec/story continuing to pass.

**Acceptance Scenarios**:

1. **Given** the migrated app, **When** `app.component.html` and
   `app.component.scss` are inspected, **Then** the four preset `@switch`
   branches and all preset stylesheet sections are gone — the template is a
   single `m3k-app-shell` element with the nav model, title, preset binding,
   projected brand/dark-mode controls, and a projected `<router-outlet />`.
2. **Given** each brand selected in the brand switcher, **When** the shell
   renders, **Then** the brand's preset is visually equivalent to the
   pre-migration shell for that brand (same structure, spacing, typography
   tokens, active-link treatment, footline/folio/pill details) in both light
   and dark modes.
3. **Given** handset width, **When** each brand/preset is exercised, **Then**
   the pre-migration handset behavior is preserved: overlay-with-hamburger for
   `sidenav` and `contents-rail`, wrapping bars for `command-bar` and
   `pill-tabs`.
4. **Given** the app layer after migration, **When** its responsibilities are
   audited, **Then** the app retains only app policy — theme service, the
   brand→preset mapping, the nav model, route definitions, and the projected
   theme controls — and contains no preset markup or preset styling.
5. **Given** the module-boundary lint rules, **When** the workspace is linted,
   **Then** the shell library may depend internally on `@m3kit/core` (and the
   styles-only theme tokens) and nothing else, the app may depend on the
   shell, and a deliberate forbidden import (e.g., shell → material) fails
   lint.

---

### User Story 3 - Page scaffolding helpers complete the composition story (Priority: P3)

As a reference consumer, I can compose the inside of a routed page with the
same kit quality as the chrome: `m3k-page-header` (display-token title,
optional subtitle, actions slot), `m3k-breadcrumbs` (accessible trail), and
`m3k-content-layout` (full / centered / split width modes), so pages I build
inside the shell look intentional without bespoke layout CSS.

**Why this priority**: These helpers round out "compose full apps" but are
additive — the shell and the migration stand without them.

**Independent Test**: Can be fully tested by mounting each helper in
isolation (spec, story, CT) with synthetic content; no demo-app changes are
required to prove them.

**Acceptance Scenarios**:

1. **Given** `m3k-page-header` with a title, **When** it renders, **Then**
   the title is a single `h1` set in the brand display typography token,
   an optional subtitle renders beneath it in a supporting token, and
   projected actions render aligned to the header's end.
2. **Given** `m3k-breadcrumbs` with an items model, **When** it renders,
   **Then** the trail is a `nav` with an accessible breadcrumb label
   containing an ordered list; intermediate items are router links, the last
   item is plain text marked `aria-current="page"`, and separators are
   presentational (hidden from assistive tech).
3. **Given** `m3k-content-layout` in each mode, **When** it renders projected
   content, **Then** `full` spans the available width, `centered` constrains
   content to a readable centered column, and `split` renders a primary
   region and a narrower aside region that stack at handset width.
4. **Given** the helpers' stylesheets, **When** audited, **Then** they are
   token-only, and all visible demo/story copy uses approved synthetic
   domains (customers, orders, invoices, support tickets, products) or
   neutral placeholder text.

---

### Edge Cases

- What happens when the nav model is empty? The shell renders its chrome with
  an empty nav region — no errors, no broken layout; content and controls
  slots still work.
- What happens when no toolbar-actions content is projected? Each preset
  renders its controls position empty without reserving broken space.
- What happens when `contents-rail` receives no rail-footer content? The
  toolbar-actions content is stamped in the rail foot (its preset-appropriate
  home); if neither is projected the foot collapses gracefully.
- What happens when a nav item omits `icon`? Icon-bearing presets (`sidenav`)
  render the row without an icon; text-only presets are unaffected. `exact`
  defaults to `false`.
- What happens when the preset input changes at runtime (the demo's brand
  switcher does exactly this)? The shell tears down the old chrome and renders
  the new preset with the same projected content; router state is unaffected.
- What happens when the viewport crosses the 959px breakpoint while an overlay
  nav is open? The nav follows the current behavior of the demo shell
  (mode/openness re-derive from the breakpoint signal).
- What happens when a breadcrumb items array has one item? It renders as the
  current page only — no separators, no links.
- What happens if shell work "helpfully" grows app features (theme switching,
  route definitions, datasource wiring)? Out of scope — theme policy and
  routing stay in the consumer; the shell renders chrome only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A new library `libs/reporting/shell` (`@m3kit/shell`) MUST exist
  as a standard non-publishable Nx Angular library, tagged so that it may
  depend internally on `@m3kit/core` (and the styles-only theme tokens) and
  nothing else; all other internal directions involving the shell MUST be
  lint errors, with no permissive catch-all.
- **FR-002**: The shell MUST export an `m3k-app-shell` standalone component
  with signal inputs: `preset` accepting exactly
  `'sidenav' | 'command-bar' | 'contents-rail' | 'pill-tabs'` (default
  `'sidenav'`), `nav` accepting a readonly array of
  `{ path: string; label: string; icon?: string; exact?: boolean }`, and
  `title` accepting a string.
- **FR-003**: The exported nav-item type and the exported preset union type
  MUST be part of the shell's public barrel so consumers (including the demo
  app's brand→preset map) type against the library.
- **FR-004**: `m3k-app-shell` MUST render all navigation and chrome itself —
  nav links, active-route marking with `aria-current="page"`, exact-match
  options, titles, footline/folio/pill decorations — from the inputs alone;
  the consumer MUST NOT need to author any per-preset markup.
- **FR-005**: The shell MUST expose three projection slots: a default content
  slot for the routed view (the consumer projects its own `<router-outlet />`;
  the shell does not own routing), a toolbar-actions template slot stamped by
  the shell in the preset-appropriate position, and an optional rail-footer
  template slot used by the `contents-rail` preset (falling back to
  toolbar-actions when absent).
- **FR-006**: Each preset's rendered structure, spacing, typography tokens,
  and interaction details MUST be visually equivalent to the corresponding
  preset in the pre-migration demo app (`sidenav` toolbar + docked nav list;
  `command-bar` prompt/caret bar, inline uppercase nav, status footline;
  `contents-rail` masthead, folio-numbered contents nav, rail foot;
  `pill-tabs` three-column toolbar with centered pill nav).
- **FR-007**: Handset behavior (≤959px) MUST be preserved per preset:
  `sidenav` and `contents-rail` switch to an over-mode overlay, closed by
  default, with a hamburger toggle, and close on nav-link activation;
  `command-bar` and `pill-tabs` wrap their bars and keep controls reachable.
- **FR-008**: The shell MUST export an `m3k-page-header` component: required
  title rendered as exactly one `h1` in the brand display typography token,
  optional subtitle input, and an actions projection slot.
- **FR-009**: The shell MUST export an `m3k-breadcrumbs` component taking a
  readonly items input (`{ label: string; path?: string }`), rendered as a
  `nav` with an accessible breadcrumb label wrapping an ordered list, router
  links for all but the last item, `aria-current="page"` on the last item,
  and assistive-tech-hidden separators.
- **FR-010**: The shell MUST export an `m3k-content-layout` component with a
  mode input accepting exactly `'full' | 'centered' | 'split'`; `split` MUST
  provide primary and aside projection regions that stack at handset width.
- **FR-011**: All shell stylesheets MUST be token-only per the contract:
  `var(--mat-sys-*)` and the closed `--app-*` contract, no raw hex, no
  per-brand selectors; rendering under all four brands × both modes requires
  zero shell code changes.
- **FR-012**: Every exported shell component MUST ship the full coverage bar
  beside it in `src/lib/`: a Vitest `*.spec.ts`, a Storybook `*.stories.ts`
  collected by the single Storybook host, and a Cypress `*.cy.ts` run by the
  shell's `component-test` target.
- **FR-013**: `apps/demo-reporting` MUST be migrated to consume
  `m3k-app-shell`: the four-preset `@switch` template and all preset
  stylesheet sections are removed from the app; the app retains only theme
  policy, the brand→preset mapping (now typed against the shell's preset
  union), the nav model, routes, and projected theme controls; existing app
  spec and story coverage continues to pass.
- **FR-014**: The shell MUST introduce no new third-party dependencies; its
  dependency surface is Angular (router/CDK) + Angular Material, already in
  the workspace. Any deviation requires a `docs/DECISIONS.md` entry.
- **FR-015**: Workspace documentation MUST be updated to stay truthful:
  AGENTS.md library graph and component inventory, README repo map,
  `docs/ADOPTION_GUIDE.md` copy-in list, and a `docs/DECISIONS.md` ADR
  recording the shell library and its boundary; every external doc
  consultation is logged in `docs/BOUNDARY_LOG.md` at the time it happens.
- **FR-016**: The full gate MUST pass after the feature: lint, test, and
  build across all projects, component tests across all CT-bearing libs
  (now including the shell), and a clean Storybook build that includes the
  shell stories.

### Key Entities

- **ShellPreset**: union of the four chrome arrangements
  (`'sidenav' | 'command-bar' | 'contents-rail' | 'pill-tabs'`) — promoted
  from the app's `LayoutPreset`.
- **ShellNavItem**: one primary navigation destination —
  `{ path, label, icon?, exact? }`; `icon` is consumed only by icon-bearing
  presets; `exact` controls active-match behavior (default `false`).
- **BreadcrumbItem**: one trail entry — `{ label, path? }`; a missing `path`
  (always the last item) renders as plain current-page text.
- **ContentLayoutMode**: `'full' | 'centered' | 'split'` width strategy for
  routed page bodies.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can compose a working four-preset application chrome
  using only the shell's documented inputs and slots — demonstrated by
  Storybook stories and Cypress CT mounting `m3k-app-shell` in all four
  presets with zero consumer-authored preset markup.
- **SC-002**: Side-by-side inspection of all four brand/preset combinations
  (light and dark, desktop and handset) finds the migrated demo visually
  equivalent to the pre-migration shell — same structure, token usage,
  active-state treatment, and handset adaptations.
- **SC-003**: `apps/demo-reporting`'s shell surface shrinks materially: the
  app template and stylesheet drop the four preset branches and all preset
  styling (~500 lines today), leaving only shell consumption and theme
  controls.
- **SC-004**: 100% of exported shell components (4 of 4) ship all three
  coverage artifacts, and the full gate — `nx run-many -t lint test build`,
  `component-test` across all CT libs including `reporting-shell`, and
  `build-storybook` — passes.
- **SC-005**: A deliberate forbidden import from the shell (e.g.,
  `@m3kit/material`) fails lint, and the boundary verification is recorded in
  `docs/BOUNDARY_LOG.md`.
- **SC-006**: An audit of the shell library finds zero raw hex values, zero
  per-brand selectors, zero new dependencies, and only synthetic/neutral
  demo copy.

## Out of Scope

- **Theme/brand switching machinery in the shell** — `ThemeService`, brand
  menus, and dark-mode toggles remain consumer policy, projected into the
  shell's slots. The shell never reads or writes theme state.
- **Routing ownership** — the shell renders `routerLink` nav from its model
  but never declares routes or hosts its own `router-outlet`; the consumer
  projects the outlet.
- **Brand→preset mapping in the lib** — which brand uses which preset is app
  policy and stays in `apps/demo-reporting/src/app/core/layout-presets.ts`.
- **New presets or preset configuration knobs** (densities, widths,
  collapsible rails) beyond the four shipped arrangements — a future feature
  with its own spec.
- **Adopting `m3k-page-header`/`m3k-breadcrumbs`/`m3k-content-layout` inside
  the demo routes** — the helpers are proven through their coverage
  artifacts; reworking demo pages would break the pixel-equivalence claim
  and is deferred.
- **E2E testing, CI provider config, publishing** — unchanged from the
  workspace's standing deferrals.

## Assumptions

- The existing `libs/reporting/shell` scaffold (Vitest target, Cypress CT
  target reusing `demo-reporting:build` with `skipServe`, tags
  `type:lib, scope:reporting-shell`, `@m3kit/shell` alias) is the landing
  zone for this feature; it currently exports only a generated placeholder
  that this feature replaces.
- "Pixel-equivalent" means structural and token-level equivalence verified by
  inspection across brands/modes/widths plus the behavioral assertions in
  specs/CT — not automated screenshot diffing, which the workspace does not
  ship.
- The 959px handset breakpoint and the demo's current handset behaviors are
  the contract to preserve; no new breakpoints are introduced.
- `DESIGN.md` remains binding for every visual decision; the shell's preset
  styling is a relocation of already-approved styling, not a redesign.
- The constitution (clean-room integrity, pinned stack, synthetic data,
  boundary-log duties, simplicity bias) governs this feature as ratified.
