# Plan 003: Spec and implement `m3k-column-manager`

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3d6b2e4..HEAD -- libs/core/src/lib/column-state.ts libs/table/src/lib libs/table/src/index.ts apps/demo-reporting/src/app/reports docs/readiness/m3kit-ui-tournament/2026-07-06 specs`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against live code before proceeding; on mismatch, STOP and ask for a refreshed plan.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `3d6b2e4`, 2026-07-07
- **Suggested executor lane**: `claude` — larger Angular UI component slice with accessibility, Storybook, Cypress, and Spec Kit artifacts.

## Why this matters

The Data Table Column Manager is the strongest next UI feature because it turns an already-shipped headless capability into a usable reporting control. Core can resolve column state; the data table accepts it; saved views and export paths already consume it. What is missing is the UI that lets a user toggle, reorder, and pin columns without hand-authored state. This is a launch-readiness feature, not speculative platform work.

## Current state

Relevant files and roles:

- `libs/core/src/lib/column-state.ts` — headless `ColumnViewState`, `ResolvedColumn`, and `resolveColumns()`.
- `libs/table/src/lib/data-table.component.ts` — `m3k-data-table`; consumes `columnState` input and resolves columns for rendering.
- `libs/table/src/lib/data-table.component.{spec.ts,stories.ts,cy.ts}` — existing coverage patterns for table artifacts.
- `libs/table/src/index.ts` — table public barrel.
- `apps/demo-reporting/src/app/reports/reports.component.ts/html/spec.ts` — demo report already owns a `columnState` signal and applies saved-view columns.
- `apps/demo-reporting/src/app/reports/saved-views.service.ts` — seeded saved views already carry column state.
- `docs/readiness/m3kit-ui-tournament/2026-07-06/*` — tournament evidence and acceptance criteria.
- `DESIGN.md` — binding visual contract; read before UI decisions.
- `.specify/memory/constitution.md` and `specs/` — Spec Kit conventions.

Current excerpts:

- Tournament winner: `docs/readiness/m3kit-ui-tournament/2026-07-06/video-package/voiceover-script.md:21-25` says the winner is Data Table Column Manager and recommends `m3k-column-manager` in `libs/table` with hidden, pinned, locked, many-column, narrow, emitted-state, keyboard/focus coverage.
- Candidate criteria: `docs/readiness/m3kit-ui-tournament/2026-07-06/feature-candidate-list.md:61-75` says `m3k-data-table` already accepts headless `columnState`; the manager should be driven by `TableDefinition` + `ColumnViewState`, emit changes, not persist, support visible/hidden/reorder/pin, avoid drag-only interaction, handle locked columns, and cover many/locked/all-hidden/pinned/compact states.
- Core model: `libs/core/src/lib/column-state.ts:4-10` says column state is headless by design and interactive chrome is separate. `:11-23` defines key, visible, pinned, and width. `:38-54` documents resolution rules. `:55-88` implements `resolveColumns()`.
- Data table: `libs/table/src/lib/data-table.component.ts:110-112` defines `columnState`; `:228-232` resolves and displays columns via `resolveColumns()`.
- Existing table specs: `libs/table/src/lib/data-table.component.spec.ts:144-207` covers hide/reorder/pin/width/duplicate/unknown/definition-change behavior.
- Demo report: `apps/demo-reporting/src/app/reports/reports.component.ts:104-113` owns `columnState` and computes export columns from resolved visible columns. `:151-158` applies saved-view columns and query together. Template passes columnState into data table at `reports.component.html:58-70`.
- Saved views: `apps/demo-reporting/src/app/reports/saved-views.service.ts:39-68` seeds views with column state and pinned/hidden columns.

Repo conventions to match:

- Component selectors use `m3k-*`.
- Standalone Angular components, signal `input()`/`output()`, `ChangeDetectionStrategy.OnPush`.
- Token-only SCSS: use `var(--mat-sys-*)` and closed `--app-*` tokens only; no raw hex and no per-brand selectors.
- Every exported component requires `.spec.ts`, `.stories.ts`, and `.cy.ts` beside it in `libs/table/src/lib/`.
- No new dependencies. No drag-only behavior; keyboard controls are mandatory.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Drift check | `git diff --stat 3d6b2e4..HEAD -- libs/core/src/lib/column-state.ts libs/table/src/lib libs/table/src/index.ts apps/demo-reporting/src/app/reports docs/readiness/m3kit-ui-tournament/2026-07-06 specs` | Either no output or changes reviewed against this plan |
| Table unit tests | `NX_DAEMON=false npx nx test m3kit-table --skip-nx-cache --runInBand` | exit 0; new ColumnManager specs pass |
| Demo report tests | `NX_DAEMON=false npx nx test demo-reporting --skip-nx-cache --runInBand` | exit 0 if demo integration is in scope |
| Table lint | `NX_DAEMON=false npx nx lint m3kit-table --skip-nx-cache` | exit 0 |
| Storybook build | `NX_DAEMON=false npx nx run m3kit-table:build-storybook --skip-nx-cache` | exit 0 |
| Component test | `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox NX_DAEMON=false npx nx run m3kit-table:component-test --skip-nx-cache` | exit 0; new cy test passes |
| Scope check | `git status --short` | only in-scope files modified |

If the executor environment cannot run Electron/Cypress, STOP after unit/lint/storybook and report the exact Cypress blocker rather than claiming full verification.

## Suggested executor toolkit

- Load `frontend-ui-engineering` if available for production Angular UI work.
- Load `test-driven-development` if available; this plan requires tests first.
- Read `DESIGN.md` before SCSS/visual decisions.

## Scope

**In scope**:

- `libs/table/src/lib/column-manager.component.ts` (new)
- `libs/table/src/lib/column-manager.component.html` (new)
- `libs/table/src/lib/column-manager.component.scss` (new)
- `libs/table/src/lib/column-manager.component.spec.ts` (new)
- `libs/table/src/lib/column-manager.component.stories.ts` (new)
- `libs/table/src/lib/column-manager.component.cy.ts` (new)
- `libs/table/src/index.ts`
- Optional demo integration only after standalone component is green: `apps/demo-reporting/src/app/reports/reports.component.ts`, `.html`, `.spec.ts`
- Optional Spec Kit pack if repo convention requires feature specs before implementation: `specs/008-column-manager/{spec.md,plan.md,tasks.md,quickstart.md,...}`
- `plans/README.md` status row

**Out of scope**:

- Persistence/storage/backends for column preferences.
- Saved View Manager UI (separate follow-up after this slice).
- Width resizing UI; `ColumnViewState.width` exists but can remain future unless implementation is trivial and tested.
- Drag-and-drop as the only reorder mechanism. If using CDK drag is tempting, STOP: adding CDK drag can be acceptable only if keyboard controls remain first-class and no new dependency is added beyond existing CDK.
- Changes to `libs/core/src/lib/column-state.ts` unless required for locked-column metadata; prefer component inputs over changing core model.
- Any raw hex colors or per-brand CSS.

## Git workflow

- Branch: continue from `chore/dogfood-app-port` unless operator creates a dedicated feature branch.
- Commit style, if asked later: conventional commits, e.g. `feat: add data table column manager`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Write a mini Spec Kit pack or confirm one exists

If the repo requires Spec Kit before implementation for new features, create `specs/008-column-manager/` with a concise feature spec, plan, tasks, and quickstart. Ground it in the tournament evidence and current files listed above.

Minimum acceptance criteria:

- `m3k-column-manager` accepts `TableDefinition<T>` and current `ColumnViewState[] | undefined`.
- Emits a full next `ColumnViewState[]` through an output, without persistence.
- Supports show/hide, keyboard reorder up/down, pin start/end/unpin.
- Prevents a user from hiding every column; either disables the last visible checkbox or re-adds a column deterministically.
- Supports locked/required columns through an input such as `lockedColumns: readonly string[]` or `isColumnLocked` predicate; locked columns cannot be hidden and their disabled reason is accessible.
- Storybook and Cypress cover many columns, locked columns, hidden-all prevention, pinned columns, compact/narrow state.

**Verify**: `git diff -- specs/008-column-manager` -> only the new feature pack exists and cites current repo evidence. If the operator says Spec Kit pack is unnecessary, skip this step and record that decision in `plans/README.md`.

### Step 2: Add failing unit tests for pure state transitions through the component

Create `libs/table/src/lib/column-manager.component.spec.ts` first. Model after `data-table.component.spec.ts` style.

Tests to add before implementation:

1. Renders one row/control per table definition column.
2. Initializes checked/pinned/order state from `columnState`, while appending missing definition columns in definition order (match `resolveColumns()` semantics).
3. Emits next state when a visible column is hidden.
4. Does not allow hiding the last visible unlocked column.
5. Emits reordered state when keyboard-accessible Move up/down buttons are clicked.
6. Emits pinned start/end/unpinned state when pin controls are clicked.
7. Locked columns are visible, disabled for hide/reorder if desired, and expose an accessible disabled reason.
8. Unknown/duplicate current state entries are ignored or first-wins consistently with `resolveColumns()`.

Use a small `InvoiceRow`/`INVOICE_DEFINITION` fixture like `data-table.component.spec.ts:18-67`.

**Verify**: `NX_DAEMON=false npx nx test m3kit-table --skip-nx-cache --runInBand` -> fails because component does not exist or tests fail.

### Step 3: Implement `ColumnManagerComponent`

Create component files in `libs/table/src/lib/`:

- Selector: `m3k-column-manager`.
- Inputs:
  - `definition = input.required<TableDefinition<T>>()`
  - `columnState = input<readonly ColumnViewState[] | undefined>(undefined)`
  - `lockedColumns = input<readonly string[]>([])` or `requiredColumns = input<readonly string[]>([])`
  - optional labels text only if needed for a11y.
- Output:
  - `columnStateChange = output<readonly ColumnViewState[]>()`

Implementation shape:

- Resolve current visible order with `resolveColumns(definition().columns, columnState())` for display, but keep hidden columns in the manager list so users can re-show them.
- Build a normalized state array that includes every definition column exactly once, in current display/manager order, with `visible`, `pinned`, and `width` preserved when present.
- For every user action, emit a normalized `ColumnViewState[]` containing changed and unchanged columns so parent state is deterministic.
- Hide action: if it would hide the last visible unlocked column, do not emit and keep control disabled; surface helper text or `aria-describedby` explaining why.
- Reorder action: provide buttons with labels like `Move Customer up` / `Move Customer down`; disable at boundaries.
- Pin action: radio buttons/select/menu are acceptable if keyboard accessible. State values: unpinned, start, end.
- No persistence, no saved-view service import.

**Verify**: `NX_DAEMON=false npx nx test m3kit-table --skip-nx-cache --runInBand` -> new unit tests pass.

### Step 4: Style token-only and export the component

Add SCSS using only tokens:

- surface/background: `var(--mat-sys-surface)`, `var(--mat-sys-surface-container)` if already used in project
- text: `var(--mat-sys-on-surface)`, `var(--mat-sys-on-surface-variant)`
- borders: `var(--mat-sys-outline-variant)`
- radii: `var(--app-radius-card)` or `var(--app-radius-control)`
- spacing via rems is fine; no raw colors.

Export from `libs/table/src/index.ts`.

**Verify**:

- `NX_DAEMON=false npx nx lint m3kit-table --skip-nx-cache` -> exit 0.
- `search_files` or equivalent check for raw hex in the new SCSS -> no matches like `#[0-9a-fA-F]{3,8}`.

### Step 5: Add Storybook coverage

Create `column-manager.component.stories.ts` in `libs/table/src/lib/`.

Stories:

- `Default` — all columns visible.
- `HiddenAndPinned` — current state hides one column and pins one start/end.
- `LockedColumns` — locked invoice/customer columns cannot be hidden.
- `ManyColumns` — enough columns to wrap/scroll.
- `Narrow` or `Compact` — shows controls remain usable in constrained width.

Use synthetic invoice definitions from existing table/testing fixtures where possible. Do not introduce real data.

**Verify**: `NX_DAEMON=false npx nx run m3kit-table:build-storybook --skip-nx-cache` -> exit 0.

### Step 6: Add Cypress component test for keyboard/focus flows

Create `column-manager.component.cy.ts`.

Tests:

- Mount component with invoice definition and current state.
- Use keyboard or button clicks to move a column up/down; assert emitted state or visible order.
- Toggle a column hidden and assert emitted state contains `visible: false`.
- Try to hide last visible column; assert the control is disabled or no hide emit occurs.
- Pin start/end and assert emitted pinned state.

Follow existing table Cypress patterns in `libs/table/src/lib/*.cy.ts`.

**Verify**: `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox NX_DAEMON=false npx nx run m3kit-table:component-test --skip-nx-cache` -> exit 0.

### Step 7: Optional demo integration

Only after the standalone component is green, decide whether to wire it into the demo report. If in scope for the assigned executor:

- Add `ColumnManagerComponent` import to `apps/demo-reporting/src/app/reports/reports.component.ts` imports array.
- In `reports.component.html`, add a toolbar/menu/expansion panel near Saved views or field filters that binds:
  - `[definition]="definition"`
  - `[columnState]="columnState()"`
  - `(columnStateChange)="columnState.set($event)"`
- Update `reports.component.spec.ts` with one test proving a column manager interaction hides/reorders/pins and the table/export columns react.

If demo integration makes the slice too broad, STOP after exported component and create a follow-up card/plan. The reusable library component is the required deliverable.

**Verify**: `NX_DAEMON=false npx nx test demo-reporting --skip-nx-cache --runInBand` -> exit 0 if demo changed.

## Test plan

- New unit spec: `libs/table/src/lib/column-manager.component.spec.ts` covering rendering, initial state, hide, hidden-all prevention, reorder, pin, locked columns, duplicate/unknown state handling.
- New story: `libs/table/src/lib/column-manager.component.stories.ts` covering default, hidden/pinned, locked, many, compact/narrow.
- New Cypress component test: `libs/table/src/lib/column-manager.component.cy.ts` covering keyboard/focus/action flows.
- Optional demo spec if integrated: update `apps/demo-reporting/src/app/reports/reports.component.spec.ts`.

## Done criteria

All must hold:

- [ ] `m3k-column-manager` exported from `@m3kit/table`.
- [ ] Component emits deterministic `ColumnViewState[]` and does not persist.
- [ ] Last visible column cannot be hidden.
- [ ] Reorder is not drag-only; keyboard/button controls are present and tested.
- [ ] Locked columns are supported and accessible.
- [ ] `.spec.ts`, `.stories.ts`, `.cy.ts` exist beside the component.
- [ ] `NX_DAEMON=false npx nx test m3kit-table --skip-nx-cache --runInBand` exits 0.
- [ ] `NX_DAEMON=false npx nx lint m3kit-table --skip-nx-cache` exits 0.
- [ ] `NX_DAEMON=false npx nx run m3kit-table:build-storybook --skip-nx-cache` exits 0.
- [ ] Cypress component test passes or exact environment blocker is reported.
- [ ] No raw hex/per-brand selectors in new SCSS.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- `ColumnViewState`/`resolveColumns` changed substantially and this plan's state assumptions no longer hold.
- Supporting locked columns appears to require changing the public `ColumnDef` or `ColumnViewState` model. Prefer component input; stop before altering core contracts.
- The UI requires a new dependency or a chart/UI library.
- Hiding-all prevention conflicts with an explicit product decision that all columns hidden should be allowed.
- You cannot make the reorder/pin controls keyboard accessible without broad redesign.
- Demo integration requires changing saved-view persistence semantics.

## Maintenance notes

- The component should remain headless about persistence; Saved View Manager can later compose it.
- Reviewers should scrutinize emitted-state normalization and keyboard accessibility.
- If width resizing is deferred, mention it explicitly in story/docs so future agents do not assume it was forgotten.
