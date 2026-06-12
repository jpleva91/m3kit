# Feature Specification: Reporting Reference Workspace Scaffold

> **Historical record:** paths/names in this document predate the 2026-06-11 generalization rename (see ADR-014 in `docs/DECISIONS.md`).

**Feature Branch**: `001-reporting-scaffold`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Scaffold a public, clean-room Angular/Nx reporting reference workspace: a green, bounded, documented skeleton — one demo app, three reporting libraries with enforced module boundaries, a Material shell with a placeholder reports route, and the governance/adoption documentation set. No reporting features yet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Workspace builds, lints, and tests green with enforced boundaries (Priority: P1)

As a reference consumer (an enterprise Angular team lead evaluating the repo for
source-internalization), I can clone the repository, install dependencies, and verify
the whole workspace is healthy with standard Nx commands — and I can see the intended
architecture expressed as Nx libraries with machine-enforced dependency rules, so the
structure cannot silently rot.

**Why this priority**: A green, bounded skeleton is the foundation every later phase
builds on. If the workspace does not verify cleanly or the boundaries are not
enforced, nothing else in the reference is trustworthy.

**Independent Test**: Can be fully tested by running a clean install followed by
lint, test, and build across all projects, plus a deliberate boundary-violation check
that must fail lint. Delivers a verifiable, structurally sound workspace.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository on the pinned stack, **When** the
   consumer runs a clean install and then lints, tests, and builds all projects,
   **Then** every project passes all three targets and each project reports at least
   one passing unit test.
2. **Given** the generated workspace, **When** the consumer inspects the project
   list, **Then** exactly these projects exist: `apps/demo-reporting`,
   `libs/reporting/core`, `libs/reporting/material`, `libs/reporting/testing`, and no
   e2e projects exist.
3. **Given** the module-boundary lint configuration, **When** a deliberate forbidden
   import is added (e.g., the core library importing from the material library),
   **Then** linting fails with a module-boundary error, and reverting the import
   makes lint pass again.
4. **Given** the library skeleton, **When** the consumer inspects
   `libs/reporting/core`, **Then** it has no dependency on Angular Material and no
   dependency on any internal library, and each library exposes minimal placeholder
   exports only — no feature logic.

---

### User Story 2 - Demo app renders a Material shell with a placeholder reports route (Priority: P2)

As a demo user (an individual developer evaluating the reporting patterns), I can
serve the app and see a minimal Material shell with a placeholder reporting route, so
I can confirm the wiring works end-to-end before any features are built.

**Why this priority**: The shell proves the application, routing, and Material
integration are wired correctly, and gives later phases a place to land — but it has
no standalone value without the green, bounded workspace from User Story 1.

**Independent Test**: Can be fully tested by serving the demo app, observing the
Material shell render, and navigating to the placeholder reports route.

**Acceptance Scenarios**:

1. **Given** the demo app is served, **When** the user opens it in a browser,
   **Then** a Material shell renders (toolbar and content area at minimum) using
   Angular Material components, with the app built as a standalone application (no
   NgModules).
2. **Given** the rendered shell, **When** the user navigates to the reports route,
   **Then** a lazily loaded placeholder component renders placeholder content (e.g.,
   "Reports — coming in a later phase") and no reporting features (tables, filters,
   data loading) are present.
3. **Given** any visible demo text, **When** it is audited, **Then** it uses only the
   approved synthetic domains (customers, orders, invoices, support tickets,
   products) or neutral placeholder copy.

---

### User Story 3 - Documentation set present and truthful for adoption and internalization (Priority: P3)

As a reference consumer, I find the governance and adoption docs in place from day
one, so the clean-room provenance and the source-internalization adoption intent are
clear before any features exist.

**Why this priority**: The documentation set is what differentiates this repository
from a generic starter — it carries the clean-room audit trail and the adoption
model. It is essential to the project's purpose but does not block the technical
skeleton.

**Independent Test**: Can be fully tested by opening each documentation file and
verifying it exists with substantive (non-stub) content consistent with the
workspace, with no private or non-synthetic terminology anywhere.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** the consumer opens `docs/`, **Then** these
   files exist with substantive initial content: `docs/CLEAN_ROOM.md` (clean-room
   policy and permitted public sources), `docs/BOUNDARY_LOG.md` (log format defined,
   entries present for public docs consulted during scaffolding),
   `docs/ADOPTION_GUIDE.md` (how a team evaluates and adopts the reference),
   `docs/INTERNALIZATION_GUIDE.md` (source import / internal fork / ownership
   transfer model), and `docs/DECISIONS.md` (records at least the pinned-stack and
   phasing decisions).
2. **Given** the repository root, **When** the consumer reads the README, **Then** it
   states what the project is, the clean-room stance, the pinned stack, and the phase
   status, and the repository is licensed Apache-2.0 with a LICENSE file at the root.
3. **Given** all docs, code, comments, and fixtures, **When** they are audited,
   **Then** none contain private terminology, proprietary API shapes, or workflows —
   only generic, public, synthetic-domain content.

---

### Edge Cases

- What happens when tooling auto-resolves newer majors (Angular 20+, Nx 21, latest
  Material) during generation or install? Versions are pinned with tilde ranges and
  verified after generation; any drift outside the pinned lines must be corrected
  before proceeding.
- What happens when a contributor adds a dependency between libraries in a forbidden
  direction (e.g., `core → material`, `material → testing`, `testing → material`)?
  Lint fails with a module-boundary error; the change cannot land.
- What happens when scaffold work "helpfully" grows real features (tables, filters,
  datasources, store usage)? That work is out of scope for this phase and is rejected
  until the clean-room review gate passes.
- What happens when an external doc page is consulted but no boundary-log entry is
  written? That is a process violation; the entry must be added at consultation time,
  not retroactively.
- How does the system handle a fresh clone on a machine with only the lockfile-driven
  install? The build must be reproducible from the committed lockfile alone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workspace MUST verify green from a fresh clone with a clean
  install: building, linting, and unit-testing all projects succeeds on the pinned
  stack, and each project has at least one passing placeholder test.
- **FR-002**: The workspace MUST contain exactly four projects — `apps/demo-reporting`,
  `libs/reporting/core`, `libs/reporting/material`, `libs/reporting/testing` — and no
  e2e projects.
- **FR-003**: Module boundaries MUST be machine-enforced via lint such that
  `material → core` and `testing → core` are allowed, `core` may depend on no
  internal library, the app may depend on all libraries, and all other internal
  dependency directions are lint errors.
- **FR-004**: A deliberate boundary violation MUST fail lint, and this verification
  MUST be performed at least once during the phase and recorded in the boundary log.
- **FR-005**: Each library MUST contain minimal placeholder exports only (a named
  placeholder type or token) — no feature logic; `libs/reporting/core` MUST have no
  dependency on Angular Material.
- **FR-006**: The demo app MUST be a standalone Angular application (no NgModules)
  that renders a Material shell (toolbar and content area at minimum) and a lazily
  loaded placeholder reports route with navigation that works.
- **FR-007**: The scaffold MUST implement no reporting features: no tables, filters,
  data loading, datasource implementations, or store usage.
- **FR-008**: The documentation set MUST exist with substantive content:
  `docs/CLEAN_ROOM.md`, `docs/BOUNDARY_LOG.md`, `docs/ADOPTION_GUIDE.md`,
  `docs/INTERNALIZATION_GUIDE.md`, and `docs/DECISIONS.md`.
- **FR-009**: A root README MUST state what the project is, the clean-room stance,
  the pinned stack, and the phase status; the repository MUST be licensed Apache-2.0
  with a LICENSE file at the root.
- **FR-010**: All placeholder, demo, and test content MUST use only the approved
  synthetic domains (customers, orders, invoices, support tickets, products) or
  neutral placeholder copy; no content may contain private terminology, API shapes,
  or workflows.
- **FR-011**: Dependencies MUST be limited to the pinned stack plus Nx-generated
  defaults; any extra dependency requires justification in `docs/DECISIONS.md`
  (expectation for the scaffold: none).
- **FR-012**: Every external doc consultation made during scaffolding MUST be logged
  in `docs/BOUNDARY_LOG.md` at the time of consultation, not retroactively.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh clone followed by a clean lockfile-driven install passes lint,
  test, and build for 100% of projects (4 of 4) on the first attempt, with each
  project reporting at least one passing test.
- **SC-002**: A deliberate forbidden import between libraries produces a lint failure
  in 100% of attempted forbidden directions, and the verification is recorded in the
  boundary log.
- **SC-003**: A demo user can serve the app and reach the placeholder reports route
  through shell navigation without errors on the first attempt.
- **SC-004**: All five governance/adoption documents and the README exist with
  substantive content; an audit of the entire working tree finds zero non-synthetic
  domain vocabulary and zero private identifiers.
- **SC-005**: Zero dependencies exist beyond the pinned stack and generator defaults
  without a recorded justification.

## Out of Scope

Future-phase work is recorded for continuity only. None of the following may be
implemented in this feature; each begins only after the clean-room compliance review
gate passes.

- **Core reporting contracts** (`libs/reporting/core`): report definitions, column
  definitions, query/filter/sort/pagination models, and datasource interfaces —
  Material-free, fully unit-tested.
- **Material reporting components** (`libs/reporting/material`): Material/CDK
  presentational and container components — report table, filter bar, toolbar —
  consuming core contracts only.
- **Synthetic invoice demo route** (`apps/demo-reporting`): a working invoice report
  using the core and material libraries with synthetic data from
  `libs/reporting/testing` factories.
- **Final clean-room review**: full-repo compliance audit before the reference is
  promoted as complete.
- **Deferred tooling**: e2e testing setup, CI provider configuration, and anything
  publish-related (likely never, per the copy-in adoption model).

## Assumptions

- The adoption model is source-internalization (copy the source in and own it), not
  an npm dependency; no publishing, semver contracts, or API stability guarantees are
  needed.
- Consumers evaluate the reference on the pinned stack only; no compatibility matrix
  for other versions is provided.
- All data in every phase is synthetic and repo-authored; no auth, backends, or
  network data sources are ever required by the reference.
- Unit testing via the workspace defaults is sufficient for the scaffold phase; e2e
  testing is deliberately deferred.
- The project constitution (clean-room integrity, pinned stack, phasing, synthetic
  data, boundary-log duties) governs this feature and is already ratified.
