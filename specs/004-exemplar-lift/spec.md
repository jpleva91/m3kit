---
status: exemplar
description: "Worked spec-kit template: adopting m3kit libs via the @m3kit/plugin:lift generator"
---

# Feature Specification: Lift m3kit Libs into a Consumer Workspace

> **EXEMPLAR — NOT PENDING WORK.** This spec is a complete worked example of
> the spec-kit flow for the kit's foundational consumer task: source-
> internalizing `libs/*` into your own Nx workspace with the
> `@m3kit/plugin:lift` generator. The generator itself is implemented and
> tested in this repository (`tools/plugin`); the *adoption* described here
> happens in a consumer workspace ("Acme") and stays on paper. Copy and
> adapt; the manual narrative lives in `docs/ADOPTION_GUIDE.md` and
> `docs/INTERNALIZATION_GUIDE.md`.

**Feature Branch**: `004-exemplar-lift`

**Created**: 2026-06-11

**Status**: Exemplar (template — not scheduled, not implemented)

**Input**: User description: "Adopt the m3kit table and dashboard suites
into Acme's existing Nx 20 / Angular 19 workspace under the `@acme/*` alias
prefix, with the theme contract resolving, module boundaries re-proven, and
the lifted code fully owned (no runtime or build-time dependency on the
m3kit repository)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One command internalizes the libs and their closure (Priority: P1)

As an Acme engineer, I run `m3kit add table dashboard --scope=acme` (or the
underlying `npx nx g @m3kit/plugin:lift --libs=table,dashboard
--scope=acme`) and the `table` and `dashboard` libs — **plus** their
dependency closure `core` and `theme` — appear under `libs/` in my
workspace, compiled against my own alias prefix.

**Why this priority**: The lift is the adoption model. If the closure is
wrong (a lifted lib imports a lib that was not lifted) or aliases dangle,
nothing downstream works.

**Independent Test**: In a fresh Nx workspace, run the command and verify
`libs/{core,theme,table,dashboard}` exist, `tsconfig.base.json` maps
`@acme/{core,table,dashboard}` (theme stays SCSS-only, no alias), and no
file under the lifted libs still references `@m3kit/*`.

**Acceptance Scenarios**:

1. **Given** a workspace without m3kit libs, **When** lift runs for
   `table,dashboard`, **Then** `core` and `theme` are included
   automatically (closure per the boundary table in AGENTS.md) and the
   tarball is fetched degit-style from
   `https://codeload.github.com/<repo>/tar.gz/<ref>` with no git and no new
   dependencies.
2. **Given** the lifted source, **When** it is grepped, **Then** every
   internal `@m3kit/<lib>` import reads `@acme/<lib>` and each
   `project.json` carries name `acme-<lib>` and tag `scope:acme-<lib>`,
   with demo-only Storybook/Cypress targets stripped.
3. **Given** a previous lift, **When** the command re-runs (same or wider
   lib set), **Then** already-lifted libs are left byte-identical (they are
   owned now) and only missing libs are added — the run is idempotent.

---

### User Story 2 - The theme contract resolves and boundaries are re-proven (Priority: P2)

As an Acme engineer, after the lift my app build resolves
`@use 'm3kit-theme'` via the SCSS includePath, and my eslint flat config
gains depConstraints equivalent to m3kit's — verified by a deliberate
violation failing lint.

**Why this priority**: Token-only components are dead weight without the
contract emitting tokens, and unenforced boundaries rot immediately.

**Independent Test**: Build the app (SCSS resolves), then add a temporary
`@acme/dashboard` import inside `libs/core` and watch lint fail.

**Acceptance Scenarios**:

1. **Given** a detectable Angular application build target, **When** lift
   runs, **Then** `stylePreprocessorOptions.includePaths` gains
   `libs/theme/src` automatically; otherwise the exact manual instruction
   is printed.
2. **Given** the consumer eslint config, **When** lift completes, **Then**
   it has **not** been rewritten; the generator printed the
   `depConstraints` block to add for `scope:acme-*` (core/theme depend on
   nothing; table/dashboard/charts/forms/shell/testing → core+theme;
   state → core), and the consumer re-proves it with a deliberate
   violation.

---

### User Story 3 - The lifted kit is buildable and pageable (Priority: P3)

As an Acme engineer, I scaffold a first page over the lifted kit
(`npx nx g @m3kit/plugin:report-page open-invoices --project=acme-app`),
the page composes `m3k-page-header` + `m3k-filter-form` + `m3k-data-table`
over a `TableDefinition` stub, and the workspace gate runs green.

**Independent Test**: Generate the page, register the printed lazy route,
serve, and see the stub rows render themed; swap the
`InMemoryTableDataSource` stub for a real datasource without touching the
lifted libs.

**Acceptance Scenarios**:

1. **Given** the lifted workspace, **When** the report page is generated,
   **Then** its imports use `@acme/*` (auto-detected from
   `tsconfig.base.json` paths) and the page renders with the stub data.
2. **Given** the full adoption, **When** `npx nx run-many -t lint test
   build` runs in the consumer workspace, **Then** it is green with the
   lifted libs participating.

---

### Edge Cases

- Unknown lib name → lift fails loudly listing the known libs; nothing is
  written.
- Tarball download fails (offline, bad ref) → clear error with the URL; the
  tree is untouched.
- `tsconfig.base.json` missing (fresh workspace) → created minimally with
  the new paths.
- No Angular build target detectable → includePaths step degrades to
  printed guidance, never a silent no-op.
- Re-run after local modifications to lifted libs → modifications preserved
  (idempotency means "never overwrite owned code", not "converge to
  upstream").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lift MUST expand the requested libs to their full internal
  dependency closure (table/dashboard/charts/forms/shell/testing →
  core+theme; state → core) before copying.
- **FR-002**: Lift MUST obtain the source as a GitHub codeload tarball
  (`<repo>` default `jpleva91/m3kit`, `<ref>` default `main`) using only
  Node built-ins (`fetch`) plus system `tar` — no git, no new npm
  dependencies.
- **FR-003**: Lift MUST rewrite every `@m3kit/<lib>` import in lifted text
  files to `@<scope>/<lib>` (scope default `ui`) and add matching
  `tsconfig.base.json` paths for TypeScript libs; `theme` keeps no alias
  (SCSS-only, includePath-resolved).
- **FR-004**: Lift MUST remap each lifted `project.json` (name
  `m3kit-<lib>` → `<scope>-<lib>`, tag `scope:m3kit-<lib>` →
  `scope:<scope>-<lib>`, implicitDependencies likewise) and strip the
  demo-only targets (`storybook`, `build-storybook`, `test-storybook`,
  `static-storybook`, `component-test`).
- **FR-005**: Lift MUST NOT modify the consumer's eslint configuration; it
  MUST print the boundary `depConstraints` guidance instead.
- **FR-006**: Lift MUST attempt to add `libs/theme/src` to
  `stylePreprocessorOptions.includePaths` of detectable Angular
  application build targets and MUST print the manual instruction either
  way.
- **FR-007**: Re-running lift MUST be idempotent: libs already present
  under `libs/<lib>` are never overwritten; rewiring (paths, includePaths)
  is re-applied without duplication.
- **FR-008**: The `m3kit add <libs...>` CLI shim MUST forward to the lift
  generator unchanged (`--scope`, `--ref`, `--repo`, `--dry-run` pass
  through).

### Success Criteria

- **SC-001**: A fresh consumer workspace goes from zero to a themed,
  boundary-enforced, page-rendering m3kit adoption in ≤ 3 commands (lift,
  page scaffold, route registration).
- **SC-002**: `grep -r "@m3kit/" libs/` in the consumer workspace returns
  nothing after lift.
- **SC-003**: The consumer's full gate (`npx nx run-many -t lint test
  build`) is green with the lifted libs included.
- **SC-004**: A deliberate boundary violation fails consumer lint
  (boundaries re-proven, per `docs/ADOPTION_GUIDE.md`).
