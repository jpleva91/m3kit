---

description: "Task list for the reporting reference workspace scaffold"
---

# Tasks: Reporting Reference Workspace Scaffold

**Input**: Design documents from `/specs/001-reporting-scaffold/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Placeholder unit tests only — one passing spec per project so `nx run-many -t test` is meaningful. No e2e in this phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Nx monorepo: `apps/demo-reporting/` for the demo app, `libs/reporting/{core,material,testing}/` for libraries, `docs/` for governance docs — see plan.md Project Structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Clean-room groundwork and workspace generation on the pinned stack

- [x] T001 Create the clean-room docs BEFORE any code: `docs/CLEAN_ROOM.md` (methodology, authorship declaration, permitted public sources, prohibited inputs, synthetic-domains rule, third-party-doc attribution policy) and `docs/BOUNDARY_LOG.md` (empty-but-formatted append-only log: date, source URL, why consulted, what was taken; entries added at consultation time, never retroactively)
- [x] T002 Create the Nx workspace pinned to Nx 20 with the Angular-monorepo preset (`create-nx-workspace@20`, app `demo-reporting`, esbuild bundler, scss, routing, standalone, no SSR, Jest unit tests, no e2e, ESLint); verify `nx report` shows Nx 20.8.4, Angular 19.2.x, TypeScript in `>=5.5 <5.9`
- [x] T003 Verify the generated app in `apps/demo-reporting/`: `app.config.ts` uses `provideRouter`, components are standalone, targets use the esbuild application builder, styles are `.scss`; `nx serve demo-reporting` boots and `nx build demo-reporting` succeeds
- [x] T004 Add Angular Material 19 + CDK 19: install `@angular/material@~19.2.0 @angular/cdk@~19.2.0` FIRST (before any ng-add, so the schematic resolves the pinned major), then run the `@angular/material:ng-add` schematic against `demo-reporting` (theme `azure-blue`, typography yes, animations yes), then install `@ngrx/signals@~19.2.0`; verify `package.json` shows Material 19.2.x with CDK peer-locked to the same version

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Library skeleton that MUST exist before boundary enforcement and shell work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Generate the three reporting libraries with tags: `libs/reporting/core` (`scope:reporting-core,type:lib`), `libs/reporting/material` (`scope:reporting-material,type:lib`), `libs/reporting/testing` (`scope:reporting-testing,type:lib`) — standalone, Jest unit tests; confirm tags in each `project.json` and import paths `@m3kit/core`, `@m3kit/material`, `@m3kit/testing` in `tsconfig.base.json`
- [x] T006 Strip each library's `src/index.ts` to a single placeholder export (named placeholder type or token) — no Material imports in `libs/reporting/core`, no real contracts anywhere; each library keeps one trivial passing spec

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Workspace builds, lints, and tests green with enforced boundaries (Priority: P1) 🎯 MVP

**Goal**: A verifiably healthy workspace whose architecture is machine-enforced

**Independent Test**: Clean install then lint/test/build all projects; a deliberate forbidden import fails lint

### Implementation for User Story 1

- [x] T007 [US1] Configure `@nx/enforce-module-boundaries` `depConstraints` in the root `eslint.config.mjs` per plan.md Module Boundaries (core → nothing internal; material → core; testing → core; `type:app` → all three reporting scopes; no permissive catch-all); ensure `apps/demo-reporting/project.json` is tagged `type:app,scope:demo`
- [x] T008 [US1] Prove enforcement with a deliberate violation: temporarily import `@m3kit/material` from inside `libs/reporting/core`, confirm `nx lint reporting-core` fails with a module-boundary error, revert, and record the check in `docs/BOUNDARY_LOG.md`
- [x] T009 [US1] Full verification run: `npx nx run-many -t lint test build` passes for all four projects with each project reporting >=1 passing test; resolved versions confirmed via `nx report`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Material shell with placeholder reports route (Priority: P2)

**Goal**: End-to-end app wiring proven by a served Material shell and a lazy placeholder route

**Independent Test**: Serve the app, see the Material shell render, navigate to `/reports` and see the placeholder

### Implementation for User Story 2

- [x] T010 [US2] Build the Material shell in `apps/demo-reporting/src/app/` (`mat-toolbar` + `mat-sidenav-container` only — no tables, filter bars, datasources, or SignalStore usage)
- [x] T011 [US2] Add a lazy `/reports` route in `apps/demo-reporting/src/app/app.routes.ts` loading a placeholder standalone component ("Reports — coming in a later phase"); navigation from the shell works
- [x] T012 [US2] Keep `apps/demo-reporting` tested: preserve or replace the generated app spec so the app still has at least one passing spec after the shell edits; serve and build pass

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Documentation set for adoption and internalization (Priority: P3)

**Goal**: Governance and adoption docs in place and truthful from day one

**Independent Test**: Open each doc and verify substantive, workspace-consistent content with no private or non-synthetic terminology

### Implementation for User Story 3

- [x] T013 [P] [US3] Complete the remaining docs set: `docs/ADOPTION_GUIDE.md` (source import / internal fork flow; delete demo app; remap tags), `docs/INTERNALIZATION_GUIDE.md` (copy-in steps, dependency reconciliation, ownership transfer), `docs/DECISIONS.md` (ADRs: pinned stack, lib split, copy-in-over-npm, no e2e yet, non-publishable libs, tag-scheme choice, header-or-NOTICE policy); verify `docs/CLEAN_ROOM.md` and `docs/BOUNDARY_LOG.md` are current, including the T008 boundary-violation entry
- [x] T014 [P] [US3] Finalize the root `README.md`: purpose, clean-room statement, pinned-stack table, quickstart commands that work as written, repo map, links to `docs/`, and the actual resolved Node/Angular/Nx/TypeScript versions from `nx report`
- [x] T015 [US3] Finalize licensing: full Apache-2.0 text in `LICENSE`, `"license": "Apache-2.0"` in `package.json`, and the per-file-header-or-NOTICE policy decided, recorded in `docs/DECISIONS.md`, and applied consistently

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Provenance-safe publication of the scaffold

- [x] T016 Initial commit with clean-room pre-commit audit: re-walk the clean-room author checklist and record the outcome in `docs/BOUNDARY_LOG.md`; verify git author/committer identity is personal (`git config user.name` / `git config user.email` before committing, `git log --format='%ae %ce'` after); confirm the committed tree contains no internal identifiers or planning-tool references; commit the full scaffold including the lockfile, `LICENSE`, and `docs/`
- [x] T017 Fresh-clone verification: clone the repository to a clean directory, run a lockfile-driven install, and confirm `npx nx run-many -t lint test build` passes for all four projects from the install alone — proving the reproducibility claim in plan.md and spec SC-001; record the result in `docs/DECISIONS.md` or the PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately; T001 MUST precede all code-generating tasks so the clean-room policy is in force before any consultation happens
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1, but the US1 boundary rules also lint the shell code
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Docs must describe the workspace as actually built, so finalization lands last

### Within Each User Story

- Boundary configuration before violation proof (T007 → T008)
- Shell before route wiring verification (T010 → T011 → T012)
- Docs content before licensing/README finalization sign-off (T013/T014 → T015)

### Parallel Opportunities

- T013 and T014 touch different files and can run in parallel
- Library generation in Phase 2 produces three independent directories but shares `tsconfig.base.json` and `nx.json`, so it runs sequentially

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 — a green, bounded workspace is the MVP
4. **STOP and VALIDATE**: `npx nx run-many -t lint test build` green; deliberate violation fails lint

### Incremental Delivery

1. Setup + Foundational → workspace skeleton exists
2. User Story 1 → verifiably green and bounded (MVP)
3. User Story 2 → served Material shell + placeholder `/reports` route
4. User Story 3 → docs/README/LICENSE complete and truthful
5. Polish → audited initial commit, fresh-clone verification

---

## Out of Scope (Future Phases)

Blocked behind the clean-room compliance review gate. Listed only so nobody starts them now:

1. **Clean-room review gate** — compliance audit of the scaffold before any feature work
2. **Core reporting contracts** — real report/column/query/filter/sort/pagination models and datasource interfaces in `libs/reporting/core`, fully unit-tested
3. **Material reporting components** — report table, filter bar, toolbar in `libs/reporting/material`; SignalStore-based container state
4. **Synthetic invoice demo route** — wire `/reports` to a working invoices report using `libs/reporting/testing` fixtures
5. **Final clean-room review** — full-repo audit before any public promotion
6. **Deferred tooling** — e2e setup, CI provider config, anything publish-related (likely never, per the copy-in adoption model)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Clean-room rules apply to every task: public sources only, every consultation logged in `docs/BOUNDARY_LOG.md` as it happens, synthetic domains only (customers, orders, invoices, support tickets, products)
- Checked tasks reflect work already completed and verified in this workspace
- Commit after each task or logical group; stop at any checkpoint to validate independently

---

**Completion evidence (2026-06-11):** all tasks verified by the in-workspace
gate and the fresh-clone gate recorded in `docs/DECISIONS.md` (Verification
record), the boundary-violation proof and pre-commit audit rows in
`docs/BOUNDARY_LOG.md`, and the single neutral initial commit on `main`.
Generated library placeholder components were replaced post-review with
named placeholder token exports (`REPORTING_*_PLACEHOLDER`) and trivial
passing specs, per the minimal-placeholder-export requirement.
