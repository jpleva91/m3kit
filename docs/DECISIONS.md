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

**Status:** Accepted

**Decision:** Three libraries under `libs/reporting/`:

- `@reporting/core` — contracts only; no Material/CDK, no internal dependencies
- `@reporting/material` — Material/CDK UI layer; may depend on core only
- `@reporting/testing` — harnesses and synthetic fixtures; may depend on core only

Tags are per-lib scopes: `scope:reporting-core`, `scope:reporting-material`,
`scope:reporting-testing`, plus `type:lib`; the app is `type:app, scope:demo`.
Dependency rules are enforced by `@nx/enforce-module-boundaries` in
`eslint.config.mjs` (core → nothing internal; material → core; testing → core;
app → all three). A deliberate violation was introduced once to confirm lint fails,
then reverted.

**Generator choice:** all three libraries, including `core`, were generated with
`@nx/angular` rather than `@nx/js`. This keeps tooling consistent across the three
libs (same generator, same lint/Jest wiring) and gives `core` an Angular-compatible
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
adoption path is: evaluate the reference → import the `libs/reporting/*` source
into your own workspace (or fork internally) → own it outright. Libraries are
non-publishable; there is no release pipeline, no semver contract, no
compatibility matrix.

**Rationale:** Reporting plumbing is the kind of code enterprise teams need to
own and adapt, not track as an upstream dependency. Optimizing for copy-in means:
minimal dependencies, conventional Nx layout, no custom executors or generators,
and a single documented rename point (the `@reporting/*` tsconfig path prefix).
See `docs/ADOPTION_GUIDE.md` and `docs/INTERNALIZATION_GUIDE.md`.

## ADR-004 — No e2e testing in the scaffold phase

**Status:** Accepted

**Decision:** The workspace was generated with `--e2eTestRunner=none`. No e2e
project exists. Unit testing is Jest via Nx defaults, with at least one passing
spec per project.

**Rationale:** In a scaffold with placeholder code only, e2e tests would assert
nothing meaningful while adding tooling weight that adopters would have to strip
or reconcile. The decision is a deferral, not a rejection: revisit once the
Material reporting shell exists and there are real user flows to cover.

## ADR-005 — Tooling: esbuild application builder, Jest, ESLint flat config

**Status:** Accepted

**Decision:** Use the Nx 20 / Angular 19 defaults unmodified: the esbuild
`@angular/build` application builder, Jest via `@nx/jest` +
`jest-preset-angular`, and ESLint flat config exactly as Nx generates it. The
only lint addition is the module-boundary `depConstraints` block (ADR-002).
No webpack, no custom builders, no bespoke plugin stack.

**Rationale:** Stock tooling is the most copy-in-friendly tooling. Every
deviation from generator defaults is something an adopting team must understand,
reproduce, or undo; the defaults are documented upstream and familiar to any
current Angular/Nx team.

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

**Status:** Accepted (provisional)

**Decision:** The demo app uses the prebuilt Angular Material M3 `azure-blue`
theme, wired by the `@angular/material:ng-add` schematic, with
`provideAnimationsAsync`. No custom Sass theming.

**Rationale:** The scaffold needs a working Material shell, not a design system.
A prebuilt theme is zero-maintenance, obviously stock (no design assets to
question the provenance of), and trivially replaced — adopters are expected to
swap in their own theme, and a custom theme example may replace this placeholder
in a later phase.

## ADR-010 — Phased delivery model with clean-room review gates

**Status:** Accepted

**Decision:** The repository is delivered in explicit phases, each gated before
the next begins:

1. **Scaffold only** — workspace, libraries, enforced boundaries, placeholder
   Material shell, governance docs (the current phase).
2. **Clean-room review gate** — a compliance audit of the scaffold against
   `CLEAN_ROOM.md` before any feature code lands.
3. **Core reporting contracts** — report/column/query/filter/sort/pagination
   models and datasource interfaces in `libs/reporting/core`.
4. **Material reporting shell** — report table, filter bar, and toolbar
   components in `libs/reporting/material`.
5. **Synthetic invoice demo route** — wire `/reports` to a working invoices
   report using `libs/reporting/testing` fixtures.
6. **Final clean-room review** — a full-repository audit before any public
   promotion or internalization handoff.

**Rationale:** Phasing keeps each review gate small enough to be meaningful: the
scaffold is audited for provenance and structure before feature code can blur
the picture, and the final audit reviews features against an already-cleared
baseline. It also keeps the scaffold honest — no speculative feature code rides
along "while we're here."

## ADR-011 — Storybook 8.6 on the Material lib (dev-only tooling)

**Status:** Accepted

**Decision:** Storybook 8.6 was added via `@nx/storybook` on the
`reporting-material` project. The stories glob is widened to include the demo
app's components, and the Material `azure-blue` theme plus the app styles are
loaded in the Storybook target so components render as they do in the app.

Storybook is development-only tooling and is **not part of the copy-in
deliverable**: adopters may delete `.storybook/` and `*.stories.ts` files when
internalizing the libraries.

**Rationale:** A visual component review surface was requested by the owner.
Hosting it on the Material lib (with the app's stories pulled into the same
instance) gives one place to review every visual component without adding a
second Storybook project, and keeping it explicitly out of the adoption
contract preserves the minimal copy-in surface from ADR-003/ADR-005.
