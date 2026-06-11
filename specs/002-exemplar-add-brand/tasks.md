---
status: exemplar
description: "Worked spec-kit template: task list for adding the Midnight brand"
---

# Tasks: Add a Custom Brand ("Midnight")

> **EXEMPLAR — NOT PENDING WORK.** Task boxes are unchecked because nothing
> here is implemented in this repository; copy this file, rename the brand,
> and check tasks off in your own workspace.

**Input**: Design documents from `/specs/002-exemplar-add-brand/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: No new unit tests — the brand contains no logic. Verification is
compile-time contract checks, the workspace gate, `build-storybook`, and a
manual brand × mode matrix walk.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Consumer brands live app-side: `apps/demo-reporting/src/styles/themes/`;
  registration points per plan.md "Registration points" — see plan.md
  Project Structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Derive the M3 palettes before any hand-authoring

- [ ] T001 Generate M3 tonal palettes from the Midnight seeds with
      `npx nx g @angular/material:theme-color` (primary `#3F51B5`, tertiary
      `#8E7CC3`, neutral `#5C5F6E`), output to
      `apps/demo-reporting/src/styles/themes/_midnight-colors.scss`.
      **Done when**: the file defines `$primary-palette` / `$tertiary-palette`
      maps in the same shape as `_terminal-colors.scss`, and the consultation
      is logged in `docs/BOUNDARY_LOG.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The brand module itself — every registration point depends on it

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Author the hand-picked token values in
      `apps/demo-reporting/src/styles/themes/_midnight.scss`: `$_typography`
      (Space Grotesk plain+brand, bold 600), `$_status-light` /
      `$_status-dark` maps covering all five kinds (worked values in
      `docs/THEMING.md`), and `$_chart-light` / `$_chart-dark` lists of
      exactly six hues each (dark list lifted/desaturated).
      **Done when**: all five status kinds appear in both maps and both chart
      lists have six entries.
- [ ] T003 Implement the two-mixin contract in the same file:
      `brand-light()` = `mat.theme` (light color from `_midnight-colors`
      palettes + typography + density 0) + `contract.status-tokens($_status-light)`
      + `contract.radius-tokens($card: 14px, $control: 8px, $badge: 999px)`
      + `contract.chart-tokens($_chart-light...)` + `color-scheme: light`;
      `brand-dark()` = `mat.theme` (dark color only) +
      `contract.status-tokens($_status-dark)` +
      `contract.chart-tokens($_chart-dark...)` + `color-scheme: dark`.
      **Done when**: the module compiles standalone via
      `@use 'm3kit-theme' as contract` and matches the mixin contract in
      `libs/reporting/theme/src/m3kit-theme/_contract.scss` (zero-argument
      mixins; dark re-emits color-bearing tokens only).

**Checkpoint**: Brand module exists — registration and verification can begin

---

## Phase 3: User Story 1 - Midnight renders every component in both modes (Priority: P1) 🎯 MVP

**Goal**: Brand selectable everywhere it should be; full-matrix reskin with
zero component changes

**Independent Test**: Serve app + Storybook, select Midnight, walk every
page/story in light and dark; diff shows no `libs/reporting/*` changes

### Implementation for User Story 1

- [ ] T004 [US1] Register the root classes in
      `apps/demo-reporting/src/styles/_theme.scss`: `@use './themes/midnight';`
      and, inside `app-theme()`, `html.theme-midnight { @include
      midnight.brand-light(); }` and `html.theme-midnight.dark { @include
      midnight.brand-dark(); }`.
      **Done when**: `npx nx build demo-reporting` compiles and the selectors
      appear in the emitted CSS.
- [ ] T005 [US1] Make the brand selectable in the app: add `'midnight'` to
      the `ThemeBrand` union and `THEME_BRANDS` list in
      `apps/demo-reporting/src/app/core/theme.service.ts`.
      **Done when**: the brand switcher in the served app lists Midnight,
      selecting it toggles `theme-midnight` on `<html>`, and the choice
      persists across a reload.
- [ ] T006 [US1] Add Midnight to the Storybook toolbar in
      `libs/reporting/material/.storybook/preview.ts`: extend the `BRANDS`
      const and add `{ value: 'midnight', title: 'Midnight' }` to the brand
      toolbar items.
      **Done when**: `npx nx run reporting-material:storybook` shows Midnight
      in the Brand toolbar and the decorator applies `theme-midnight` to the
      preview root.
- [ ] T007 [US1] Matrix walk: in the served app and in Storybook, select
      Midnight and walk every page and every story in light and dark.
      **Done when**: every surface restyles (tables, badges, KPI cards,
      charts, forms), no Instruments colors bleed through, the console is
      clean, and `git status` shows zero modified files under
      `libs/reporting/*/src/lib`.

**Checkpoint**: At this point, User Story 1 should be fully functional and
testable independently

---

## Phase 4: User Story 2 - The brand emits the complete token contract (Priority: P2)

**Goal**: Provably complete token emission; partial brands cannot compile

**Independent Test**: Inspect emitted custom properties for both selectors;
deliberately break the maps and watch the build fail

### Implementation for User Story 2

- [ ] T008 [US2] Audit the light emission: with Midnight active (light),
      inspect computed styles on `<html>` and confirm all ten
      `--app-status-*-bg/fg` pairs, `--app-radius-{card,control,badge}`,
      `--app-chart-1..6`, and `--mat-sys-*` color/typography tokens resolve
      to Midnight values, with `color-scheme: light`.
      **Done when**: every contract token listed in spec SC-002 is present
      and non-inherited.
- [ ] T009 [US2] Audit the dark emission: toggle dark and confirm status and
      chart tokens flip to the dark values, M3 color tokens re-emit,
      typography/density/radius values are unchanged from light (cascade,
      not re-emission), and `color-scheme: dark`.
      **Done when**: spec acceptance US2-2 holds.
- [ ] T010 [US2] Prove the compile-time gates: temporarily delete the `void`
      kind from `$_status-light` → build fails in `status-tokens()`; restore;
      temporarily pass five colors to `chart-tokens()` → build fails;
      restore.
      **Done when**: both deliberate breaks fail the build, both reverts
      compile green (mirrors the boundary-violation proof pattern from
      001/T008).

**Checkpoint**: At this point, User Stories 1 AND 2 should both work
independently

---

## Phase 5: User Story 3 - Brand fonts load everywhere the brand renders (Priority: P3)

**Goal**: Space Grotesk actually renders in both documents

**Independent Test**: Devtools rendered-font inspection in app and Storybook

### Implementation for User Story 3

- [ ] T011 [P] [US3] Extend the Google Fonts `<link>` in
      `apps/demo-reporting/src/index.html` with
      `&family=Space+Grotesk:wght@400;500;600`.
      **Done when**: the served app with Midnight active shows Space Grotesk
      as the rendered font for body and headings (devtools → rendered fonts),
      not a fallback.
- [ ] T012 [P] [US3] Make the same addition in
      `libs/reporting/material/.storybook/preview-head.html`.
      **Done when**: Storybook stories under Midnight render Space Grotesk.
- [ ] T013 [US3] License check: confirm every added family is OFL (Google
      Fonts license page) per ADR-012, and log the consultation in
      `docs/BOUNDARY_LOG.md`.
      **Done when**: the boundary log carries the entry and no non-OFL family
      was added.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Gate the addition like any other feature work

- [ ] T014 Full gate: `npx nx run-many -t lint test build` green for all
      projects, then
      `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox npx nx run-many -t component-test`
      green, then `npx nx run reporting-material:build-storybook` compiles
      clean.
      **Done when**: all three commands exit 0 with no new warnings
      attributable to the brand.
- [ ] T015 Docs stay truthful in the same change: if your workspace documents
      its available brands (README, THEMING equivalent), add Midnight there;
      record any consequential deviations from this template in your
      decisions log.
      **Done when**: no doc claims a brand list that the code contradicts.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — palettes are required input for the
  brand module
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on
  other stories
- **User Story 2 (P2)**: Can start after Foundational — independent of US1,
  though the in-browser audits (T008/T009) are easiest with US1's switcher
  wiring in place
- **User Story 3 (P3)**: Can start after Foundational — independent (font
  loading does not depend on registration)

### Within Each User Story

- Aggregator before service verification (T004 → T005); toolbar after the
  brand exists (T006); matrix walk last (T007)
- Light audit before dark audit before break-proof (T008 → T009 → T010)
- Font links before license sign-off (T011/T012 → T013)

### Parallel Opportunities

- T011 and T012 touch different files and can run in parallel
- T005 and T006 touch different files and can run in parallel once T004 lands

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Midnight selectable and rendering
   everywhere is the MVP
4. **STOP and VALIDATE**: matrix walk clean; zero `libs/reporting/*` diffs

### Incremental Delivery

1. Setup + Foundational → brand module compiles
2. User Story 1 → full-matrix reskin in app + Storybook (MVP)
3. User Story 2 → emission proven complete; compile-time gates proven live
4. User Story 3 → typography truthful in both documents
5. Polish → workspace gate + build-storybook green, docs current

---

## Out of Scope (deliberately not tasks)

1. **New layout preset** — Midnight wears an existing shell preset; layout is
   out of token scope (DESIGN.md, binding)
2. **Contract changes** — no new `--app-*` tokens; a brand that needs one has
   found a contract gap, which is its own specced feature
3. **Per-brand component CSS** — forbidden everywhere, always
4. **Changes to existing brands or any `libs/reporting/*` code**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Clean-room rules apply to every task: public sources only, every
  consultation logged in `docs/BOUNDARY_LOG.md` as it happens
- This file is the template for how brand-addition work is tasked; 001's
  tasks.md is the template for feature work generally
