# Decisions

Lightweight architecture decision records (ADRs) for this repository. Each entry is
short on purpose: what was decided, what was considered, and why. Consequential
changes (dependency additions, version moves, structural changes) get a new entry
here in the same change that makes them.

Format: `ADR-NNN — Title` / Status / Decision / Rationale.

---

## ADR-001 — Pinned stack: Angular ~19.2.0, Nx 20.8.4, TypeScript 5.7.3

**Status:** Accepted

**Decision:** The stack is pinned, not floated:

- `@angular/*` on the `~19.2.0` line (resolved: 19.2.25)
- `@angular/material` 19.2.19 / `@angular/cdk` 19.2.19 (peer-locked to Material)
- `@ngrx/signals` 19.2.1
- Nx 20.8.4 (the terminal Nx 20 release; Nx 20 is the Angular-19-compatible major)
- TypeScript 5.7.3, within Angular 19.2's supported range of `>=5.5 <5.9`

Tilde ranges (never `^` across minors) for framework packages; the lockfile is
committed and is part of the reference.

**Rationale:** This repository exists to be copied into other workspaces, not
consumed as a dependency. A pinned, mutually-compatible version set is what makes
copy-in predictable: an adopting team can reproduce the exact build, diff against
their own versions, and upgrade on their own schedule. "Latest" is not a reason to
change anything here; version moves require a new ADR.

## ADR-002 — Library split: core / material / testing, with per-lib scope tags

**Status:** Accepted (amended 2026-06-11)

**Decision:** Three libraries under `libs/`:

- `@m3kit/core` — contracts only; no Material/CDK, no internal dependencies
- `@m3kit/table` — Material/CDK UI layer; may depend on core only
- `@m3kit/testing` — harnesses and synthetic fixtures; may depend on core only

Tags are per-lib scopes: `scope:m3kit-core`, `scope:m3kit-table`,
`scope:m3kit-testing`, plus `type:lib`; the app is `type:app, scope:demo`.
Dependency rules are enforced by `@nx/enforce-module-boundaries` in
`eslint.config.mjs` (core → nothing internal; material → core; testing → core;
app → all three). A deliberate violation was introduced once to confirm lint fails,
then reverted.

> **Amendment note (2026-06-11):** The library set has grown from three to six
> under `libs/`. In addition to the original core/material/testing:
>
> - `@m3kit/dashboard` — dashboard primitives (KPI cards, detail cards, grid);
>   may depend on core only (`scope:m3kit-dashboard`)
> - `@m3kit/forms` — typed form components and definition-driven filter forms;
>   may depend on core only (`scope:m3kit-forms`)
> - `m3kit-theme` — the SCSS-only theming SDK (`scope:m3kit-theme`).
>   It has no TypeScript entry point and therefore sits outside the
>   TS module-boundary graph; its coupling is via SCSS `@use` and a
>   `stylePreprocessorOptions.includePaths` entry, with cache correctness
>   handled by `implicitDependencies` in consuming projects.
>
> The boundary rules extend the original scheme unchanged in spirit: core →
> nothing internal; material/testing/dashboard/forms → core only; the app may
> depend on all libs. The per-lib scope-tag rationale below applies to all six.

**Generator choice:** all three libraries, including `core`, were generated with
`@nx/angular` rather than `@nx/js`. This keeps tooling consistent across the three
libs (same generator, same lint/test wiring — Jest at generation time, Vitest
since the ADR-005 amendment of 2026-06-11) and gives `core` an Angular-compatible
test setup out of the box. `core` nonetheless stays free of Angular Material/CDK
imports — that freedom is enforced by the boundary rule, not by the generator.

**Considered alternative:** a type-based tag scheme (`type:core` / `type:ui` /
`type:testing` with a single `scope:reporting`). Both schemes enforce identical
dependency semantics.

**Rationale for per-lib scopes:** the scope tag names the exact unit an adopting
team copies in, so each constraint reads directly as a statement about a concrete,
individually-liftable library ("material may depend on core") rather than an
abstract layer taxonomy. With only three libraries, the indirection of a type
layer adds vocabulary without adding enforcement.

## ADR-003 — Adoption model: copy-in (source internalization), not npm

**Status:** Accepted

**Decision:** This repository is never published as an npm package. The intended
adoption path is: evaluate the reference → import the `libs/*` source
into your own workspace (or fork internally) → own it outright. Libraries are
non-publishable; there is no release pipeline, no semver contract, no
compatibility matrix.

**Rationale:** Reporting plumbing is the kind of code enterprise teams need to
own and adapt, not track as an upstream dependency. Optimizing for copy-in means:
minimal dependencies, conventional Nx layout, no custom executors or generators,
and a single documented rename point (the `@m3kit/*` tsconfig path prefix).
See `docs/ADOPTION_GUIDE.md` and `docs/INTERNALIZATION_GUIDE.md`.

## ADR-004 — No e2e testing in the scaffold phase

**Status:** Accepted

**Decision:** The workspace was generated with `--e2eTestRunner=none`. No e2e
project exists. Unit testing is Vitest (originally Jest; see the ADR-005
amendment of 2026-06-11), with at least one passing spec per project.

**Rationale:** In a scaffold with placeholder code only, e2e tests would assert
nothing meaningful while adding tooling weight that adopters would have to strip
or reconcile. The decision is a deferral, not a rejection: revisit once the
Material reporting shell exists and there are real user flows to cover.

## ADR-005 — Tooling: esbuild application builder, Vitest, ESLint flat config

**Status:** Accepted (amended 2026-06-11)

**Decision (as amended 2026-06-11):** Use the esbuild `@angular/build`
application builder and ESLint flat config exactly as Nx generates them; the
only lint addition is the module-boundary `depConstraints` block (ADR-002).
Unit testing is **Vitest** via `@nx/vite:test` with
`@analogjs/vite-plugin-angular` (one `vite.config.mts` and `src/test-setup.ts`
per project), and component testing for the UI libraries is **Cypress component
testing** via `@nx/cypress` with the stock `nxComponentTestingPreset`.
No webpack, no custom builders, no bespoke plugin stack.

> **Amendment note (2026-06-11):** As originally accepted, this ADR specified
> Jest via `@nx/jest` + `jest-preset-angular` (the Nx generator default at
> scaffold time). The workspace was migrated from Jest to Vitest + Cypress CT;
> every project's `test` target now runs `@nx/vite:test`, and the Jest configs
> were removed. The esbuild and ESLint portions of the original decision are
> unchanged.

**Rationale:** Stock tooling is the most copy-in-friendly tooling. Every
deviation from generator defaults is something an adopting team must understand,
reproduce, or undo; the defaults are documented upstream and familiar to any
current Angular/Nx team. Vitest keeps the test runner on the same Vite/esbuild
toolchain as the builder, which is faster and has a smaller config surface than
the Jest setup it replaces.

## ADR-006 — Package manager: pnpm

**Status:** Accepted

**Decision:** pnpm 10 is the package manager. `pnpm-lock.yaml` is committed.
Fresh-clone verification uses `pnpm install --frozen-lockfile` (not `npm ci`).

**Rationale:** A single committed lockfile under a single package manager keeps
the reproducible-build claim honest. pnpm's strict node_modules layout also
surfaces undeclared dependencies early, which matters in a repo whose libraries
advertise a minimal, explicit dependency set. Adopters internalizing the source
will reconcile dependencies into their own workspace's package manager regardless.

## ADR-007 — Node version: 24 in practice, 20/22 LTS recommended

**Status:** Accepted (recorded divergence)

**Decision:** Node 20/22 LTS was the initial target; the workspace was built and
verified on Node 24.16.0, and that is what the README records.

**Rationale:** Recording the truth beats recording the intention. Nx 20 and
Angular 19.2 build, lint, and test green on Node 24 here; nothing in the repo
depends on Node-24-only behavior, so 20/22 LTS remains the safe recommendation
for adopters. If a Node-version-specific issue ever surfaces, it gets a new ADR.

## ADR-008 — License headers: none per-file; LICENSE + README notice instead

**Status:** Accepted

**Decision:** No per-file copyright/license headers. The Apache-2.0 grant is
carried by the root `LICENSE` file, the `license` field in `package.json`, and a
NOTICE-style statement in the README's license section.

**Rationale:** Per-file headers are exactly the kind of boilerplate that creates
friction in a copy-in model — every internalized file would carry text the
adopting team must review, keep, or strip. Apache-2.0 does not require per-file
headers; the appendix boilerplate is an option, not an obligation. One LICENSE
file plus a clear README statement covers the whole tree with zero per-file noise.

## ADR-009 — Theme: azure-blue prebuilt Material theme (placeholder)

**Status:** Superseded 2026-06-11 (originally accepted as provisional)

**Decision:** The demo app uses the prebuilt Angular Material M3 `azure-blue`
theme, wired by the `@angular/material:ng-add` schematic, with
`provideAnimationsAsync`. No custom Sass theming.

**Rationale:** The scaffold needs a working Material shell, not a design system.
A prebuilt theme is zero-maintenance, obviously stock (no design assets to
question the provenance of), and trivially replaced — adopters are expected to
swap in their own theme, and a custom theme example may replace this placeholder
in a later phase.

> **Amendment note (2026-06-11) — superseded.** The placeholder played out
> exactly as anticipated: the azure-blue prebuilt CSS has been removed and
> replaced by the **Instruments design system** (see `DESIGN.md`). Theming is
> now custom M3 Sass: tonal palettes are generated from seed colors via the
> `@angular/material:theme-color` schematic, and a multi-brand token
> architecture lives in `libs/theme` (component-facing `--app-*`
> token contract plus a two-mixin brand contract), with the demo app shipping
> additional example brands. See `docs/THEMING.md` for the full architecture.

## ADR-010 — Phased delivery model with clean-room review gates

**Status:** Accepted

**Decision:** The repository is delivered in explicit phases, each gated before
the next begins:

1. **Scaffold only** — workspace, libraries, enforced boundaries, placeholder
   Material shell, governance docs (the current phase).
2. **Clean-room review gate** — a compliance audit of the scaffold against
   `CLEAN_ROOM.md` before any feature code lands.
3. **Core reporting contracts** — report/column/query/filter/sort/pagination
   models and datasource interfaces in `libs/core`.
4. **Material reporting shell** — report table, filter bar, and toolbar
   components in `libs/table`.
5. **Synthetic invoice demo route** — wire `/reports` to a working invoices
   report using `libs/testing` fixtures.
6. **Final clean-room review** — a full-repository audit before any public
   promotion or internalization handoff.

**Rationale:** Phasing keeps each review gate small enough to be meaningful: the
scaffold is audited for provenance and structure before feature code can blur
the picture, and the final audit reviews features against an already-cleared
baseline. It also keeps the scaffold honest — no speculative feature code rides
along "while we're here."

## ADR-011 — Storybook 8.6 on the Material lib (dev-only tooling)

**Status:** Accepted (amended 2026-06-11)

**Decision:** Storybook 8.6 was added via `@nx/storybook` on the
`m3kit-table` project. The stories glob is widened to include the demo
app's components, and the Material `azure-blue` theme plus the app styles are
loaded in the Storybook target so components render as they do in the app.

> **Amendment note (2026-06-11):** With ADR-009 superseded, Storybook no
> longer loads the azure-blue prebuilt theme. Instead,
> `libs/table/.storybook/storybook-theme.scss` consumes the same
> shared brand aggregator the app uses, registering all four brands
> (Instruments, Terminal, Ledger, Field Guide); brand and light/dark mode are
> selected via Storybook toolbar globals. The single-Storybook architecture is
> reaffirmed: stray per-project Storybook configs that had accumulated were
> removed, leaving `m3kit-table` as the one Storybook host.

Storybook is development-only tooling and is **not part of the copy-in
deliverable**: adopters may delete `.storybook/` and `*.stories.ts` files when
internalizing the libraries.

**Rationale:** A visual component review surface was requested by the owner.
Hosting it on the Material lib (with the app's stories pulled into the same
instance) gives one place to review every visual component without adding a
second Storybook project, and keeping it explicitly out of the adoption
contract preserves the minimal copy-in surface from ADR-003/ADR-005.

## ADR-012 — Runtime web-font and icon-font loading from Google Fonts

**Status:** Accepted (2026-06-11)

**Decision:** Brand typefaces and the Material Icons font are loaded at runtime
from the Google Fonts CDN via `<link>` tags — in
`apps/demo-reporting/src/index.html` for the app and
`libs/table/.storybook/preview-head.html` for Storybook. The
families loaded (Instrument Sans, DM Serif Display, JetBrains Mono, Archivo,
IBM Plex Mono, Fraunces, Source Sans 3, Outfit, DM Mono) are all licensed
under the SIL Open Font License; Material Icons is Apache-2.0. No font binaries
are vendored into the repository.

**Rationale:** For a public reference, CDN loading keeps the repo free of
binary assets, makes the font provenance trivially auditable (one URL per
document, all OFL/Apache-licensed families), and keeps brand-font swaps a
one-line change. Adopters with offline, privacy, or supply-chain requirements
may self-host instead — download the same OFL/Apache-licensed families, serve
them from their own infrastructure, and replace the `<link>` tags with
`@font-face` rules. `docs/THEMING.md` notes this self-hosting option in its
fonts section.

## ADR-013 — Shell library: app chrome promoted from the demo app to `@m3kit/shell`

**Status:** Accepted (2026-06-11)

**Decision:** The application shell — the four chrome presets (`sidenav`,
`command-bar`, `contents-rail`, `pill-tabs`), page header, breadcrumbs, and
content layout — is promoted out of `apps/demo-reporting` into a new library,
`libs/shell` (`@m3kit/shell`, tags `type:lib, scope:m3kit-shell`).
The preset markup/styles were relocated (not redesigned) from the app's
`AppComponent` into `m3k-app-shell`, with consumer content injected through
projected `ng-content` plus template-slot directives
(`ShellToolbarActionsDirective`, `ShellRailFooterDirective`). The
brand→preset mapping (`BRAND_LAYOUT_PRESETS`) deliberately stays in the demo
app: the shell exposes the brand-agnostic `ShellPreset` union, and which brand
gets which chrome remains app policy. The boundary follows the sibling libs —
`scope:m3kit-shell` may depend on `core` (and the SCSS-only theme token
contract) only, never on `material`/`dashboard`/`charts`/`forms`/`testing`;
the constraint is enforced in `eslint.config.mjs` and was proven with a
deliberate violation (logged in `BOUNDARY_LOG.md`).

**Rationale:** The demo app carried the most reusable chrome in the repo as
private app code, which contradicted the adoption model (libs are the asset,
the app is disposable). Promoting it makes the shell copyable per
`ADOPTION_GUIDE.md` and puts it under the full coverage bar (spec, story,
Cypress CT per exported component). Keeping brand→preset selection out of the
lib keeps layout orthogonal to theming — adopters with one brand, or different
chrome-per-brand opinions, take the presets without inheriting demo policy.
Template-slot directives (rather than `@Input` templates or subclassing) keep
the consumer surface declarative and let each preset stamp the same projected
controls at its own preset-appropriate position.

## ADR-014 — Generalization: m3kit is a general-purpose UI library; reporting is demo-only

**Status:** Accepted (2026-06-11)

**Decision:** By owner directive, the repository's identity is generalized
pre-publication: **m3kit is a general-purpose, rethemable Material 3 UI
component library** for Angular/Nx. "Reporting" is only the *demo domain* —
the synthetic scenario the demo app uses to exercise the components. The
rename is a **clean break with no compatibility aliases** (nothing has been
published, so there is nothing to deprecate). Rename map:

- **Directories:** `libs/reporting/{core,material,dashboard,forms,charts,shell,theme,testing}`
  → `libs/{core,table,dashboard,forms,charts,shell,theme,testing}` (the
  `libs/reporting/` grouping folder is removed; `material` becomes `table`).
- **Nx projects:** `reporting-*` → `m3kit-*` (`reporting-material` →
  `m3kit-table`).
- **TS aliases:** `@m3kit/material` → `@m3kit/table`; the other `@m3kit/*`
  aliases keep their names with targets repointed to `libs/*`. `theme`
  remains SCSS-only with no alias (includePath `libs/theme/src`).
- **Tags / boundaries:** `scope:reporting-*` → `scope:m3kit-*` in every
  `project.json` and in the root `eslint.config.mjs` `depConstraints`;
  semantics unchanged (core → nothing; each UI lib and testing → core +
  theme; app → all).
- **Components/types:** domain-neutral names in lib code — e.g.
  `report-table` → `data-table`, `report-filter-bar` → `table-filter-bar`,
  `report-toolbar` → `page-toolbar`; selectors keep the `m3k-` prefix.
- **Unchanged:** `apps/demo-reporting` (name and reporting scenario — it *is*
  the demo), the synthetic demo domains (customers, orders, invoices, support
  tickets, products), and the repository directory name.
- **Docs:** README/AGENTS/DESIGN/docs reframed UI-library-first;
  `specs/001-reporting-scaffold` and `specs/003-shell-lib` are preserved as
  historical records with a frontmatter note (their paths/names predate this
  rename); `specs/002-exemplar-add-brand` is a forward-facing exemplar and is
  updated to the new names.

**Rationale:** Nothing in the libraries is reporting-specific — tables,
dashboards, charts, forms, shells, and theming are general-purpose UI. Naming
the kit after its demo scenario undersold it and would have hardened a
misleading identity at publication. Doing the rename pre-publication makes a
clean break free: no published artifact, no semver contract, no consumers to
migrate.

## ADR-015 — `@m3kit/plugin` stays unpublished; docs may not advertise npx

**Status:** Accepted (2026-06-12)

**Decision:** The Nx plugin (`tools/plugin`, package `@m3kit/plugin`) is
**not published to npm** and remains `private: true` pending a deliberate
publishing decision (which would get its own ADR: registry, versioning,
release process, support expectations). Two consequences:

- `package.json` is kept *publish-ready* — correct `bin` entry, `files`
  list, `repository`/`license`/`description` — so flipping the decision
  later is a one-line change, but the `private` flag is the source of truth
  until then.
- Documentation must not present `npx m3kit ...` / `m3kit add ...` as
  working commands. Docs lead with what works today: `npx nx g
  @m3kit/plugin:...` from this repo, or from a consumer workspace after
  building (`npx nx build m3kit-plugin`) and installing the output
  (`pnpm add -D @m3kit/plugin@file:.../dist/tools/plugin`); the CLI shim
  runs as `node dist/tools/plugin/bin/m3kit.js add ...` (or `pnpm exec
  m3kit` once the built package is installed). The npx form may be
  mentioned only as future, post-publication behavior.

**Rationale:** The repository's distribution doctrine is fetch-and-own —
nothing is published to npm (README, ADR-001). Advertising `npx m3kit add`
while the package is private contradicted that doctrine and could not work
for external consumers. Publishing is a real commitment (semver contract,
release cadence, registry hygiene) that should be taken deliberately, not
implied by docs; until it is, claims and reality must match.

## Verification record — scaffold phase (2026-06-11)

- In-workspace gate: `npx nx run-many -t lint test build` green for all four
  projects (also re-run independently with `--skip-nx-cache` during review).
- Fresh-clone reproducibility (per ADR-006): repository cloned to a clean
  directory, `pnpm install --frozen-lockfile`, then the same gate — green for
  all four projects from the lockfile-driven install alone.
- Module boundaries: a deliberate `@m3kit/table` import in
  `libs/core` failed lint with `@nx/enforce-module-boundaries`,
  was reverted, and lint ran green (logged in `BOUNDARY_LOG.md`).
