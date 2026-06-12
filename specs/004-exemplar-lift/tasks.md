---
status: exemplar
description: "Worked spec-kit template: task list for adopting m3kit via the lift generator"
---

# Tasks: Lift m3kit Libs into a Consumer Workspace

> **EXEMPLAR — NOT PENDING WORK.** Task boxes are unchecked because the
> adoption happens in a consumer workspace, not here. Copy this file into
> your own spec flow and check tasks off there.

**Input**: Design documents from `/specs/004-exemplar-lift/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: The generator is already unit-tested in this repo
(`npx nx test m3kit-plugin`). Consumer-side verification is the gate, the
`@m3kit/*` grep, and the deliberate boundary violation.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the plugin runnable and the workspace lift-ready

- [ ] T001 Reconcile versions per `docs/ADOPTION_GUIDE.md` (Angular 19.2.x,
      Material/CDK 19.2.x, Nx 20.8.x, `@ngrx/signals` 19.2.x) in the
      consumer `package.json`
- [ ] T002 Build and vendor/link the plugin: `npx nx build m3kit-plugin`
      in m3kit, then make `@m3kit/plugin` resolvable in the consumer
      workspace (`pnpm link` or copy `dist/tools/plugin`)
- [ ] T003 Choose the alias scope (`acme`) and a reproducible `--ref`
      (a tag/SHA, not `main`)

## Phase 2: User Story 1 — One command internalizes the libs (US1)

- [ ] T004 [US1] Run `m3kit add table dashboard --scope=acme --ref=<tag>`
      (shim for `npx nx g @m3kit/plugin:lift --libs=table,dashboard
      --scope=acme --ref=<tag>`)
- [ ] T005 [US1] Verify the closure: `libs/{core,theme,table,dashboard}`
      exist; `tsconfig.base.json` maps `@acme/{core,table,dashboard}` and
      has no `@acme/theme`
- [ ] T006 [US1] Verify the rewrite: `grep -r "@m3kit/" libs/` is empty;
      each lifted `project.json` has name `acme-<lib>`, tag
      `scope:acme-<lib>`, and no demo-only Storybook/Cypress targets
- [ ] T007 [US1] Re-run the same command and confirm a clean idempotent
      no-op (owned files byte-identical)
- [ ] T008 [US1] Commit the lift as its own reviewed change — this is an
      ownership transfer, review it like one

## Phase 3: User Story 2 — Theme resolves, boundaries re-proven (US2)

- [ ] T009 [US2] Confirm `stylePreprocessorOptions.includePaths` gained
      `libs/theme/src` on the app build target (auto-patched), or apply
      the printed instruction by hand; `@use 'm3kit-theme'` must compile
- [ ] T010 [US2] Add the printed `scope:acme-*` depConstraints to the
      consumer `@nx/enforce-module-boundaries` config (the generator never
      edits eslint)
- [ ] T011 [US2] Re-prove the boundaries: add a temporary
      `@acme/dashboard` import inside `libs/core`, watch lint fail,
      revert
- [ ] T012 [P] [US2] Wire the lifted libs into the consumer test runner
      (vitest workspace globs covering `libs/**`) and, optionally, a
      Storybook host replacing the stripped demo targets

## Phase 4: User Story 3 — First page over the lifted kit (US3)

- [ ] T013 [US3] `npx nx g @m3kit/plugin:report-page open-invoices
      --project=acme-app` (scope auto-detected as `acme` from
      tsconfig paths)
- [ ] T014 [US3] Register the printed lazy route and serve; stub rows
      render themed (header + filter form + data table)
- [ ] T015 [US3] Replace the `InMemoryTableDataSource` stub with a real
      `TableDataSource<T>` implementation — no lifted-lib edits required
- [ ] T016 [US3] Run the consumer gate: `npx nx run-many -t lint test
      build` green with the lifted libs participating

## Dependencies

- Phase 2 depends on Phase 1; Phases 3 and 4 depend on Phase 2's T009
  (theme) — T010–T012 can proceed in parallel with Phase 4.

## Done Criteria

- SC-001..SC-004 in spec.md hold: ≤ 3 commands to a rendering page, zero
  `@m3kit/*` references, consumer gate green, deliberate violation fails
  lint.
