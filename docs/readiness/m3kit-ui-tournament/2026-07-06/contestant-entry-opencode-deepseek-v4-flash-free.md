Let me explore the existing table infrastructure to ground the proposal.
Here is my entry packet.

---

# Contestant Entry: **m3k-column-manager**

## Selected feature

**Candidate D — Data Table Column Manager** (`libs/table`), self-scoped to the headless column-state contracts that already exist in `libs/core`.

Rejects the full "column manager panel with drag-and-drop + pin + resize + width live-editing" surface in one shot. The scope of **this** entry is: visibility toggles, reorder (keyboard-move up/down), and pin left/right via a menu panel. Resize-by-drag and live width editing are explicitly deferred to a follow-up slice (see Risks).

## Why this wins for m3kit readiness

The existing `m3k-data-table` accepts `columnState: InputSignal<readonly ColumnViewState[] | undefined>` and resolves it through `resolveColumns()` — a pure, tested, headless function in `libs/core` (`column-state.ts:55`). Every column in the table already **can** be hidden, reordered, and pinned. But no component ships the UI to *produce* that state. Consumers must wire their own dropdown, manage `ColumnViewState[]` manually, and emit it back into the table's input.

This is the biggest one-touch launch-readiness gap in the table surface: enterprise users expect a column-manager affordance as baseline. The headless infrastructure is paid for, tested, and merged; the UI is all that's missing. The component lives entirely within `libs/table` (no new boundaries), is stateless (emits changes, does not persist), and can later compose with `SavedView` (`libs/core/src/lib/saved-view.ts`) and the future `m3k-saved-view-manager` (Candidate A) by emitting `ColumnViewState[]` that a view-manager captures.

Fits all tournament selection criteria from `feature-candidate-list.md:6-12`:
- Strengthens launch readiness for a source-internalized reporting kit (column management is a minimal table expectation).
- Fits `libs/table` boundary and `m3k-*` surface; depends only on `@m3kit/core` (`ColumnViewState`, `ColumnDef`, `resolveColumns`).
- Token-only: draws only `var(--mat-sys-*)` tokens, uses existing Material menu infrastructure under the hood.
- Useful without credentials, network, model downloads, or real data.
- Independently spec-kittable with unit spec, Storybook story, and Cypress component test.

## Component API sketch
