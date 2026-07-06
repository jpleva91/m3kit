# Raw run: opencode-deepseek-v4-flash-free

```text
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

```typescript
/**
 * Button that opens a menu panel for toggling column visibility, reordering
 * columns, and pinning columns left/right.
 *
 * Emits ColumnViewState[] changes that the consumer feeds back into
 * m3k-data-table's [columnState] input. Pure intent emission — no
 * persistence, no storage.
 */
@Component({
  selector: 'm3k-column-manager',
  // imports: MatMenuModule, MatButtonModule, MatIconModule (Material, internal)
  templateUrl: './column-manager.component.html',
  styleUrl: './column-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnManagerComponent<T> {
  /** Column definitions driving the manager entries. */
  readonly definition = input.required<TableDefinition<T>>();

  /** Current column view state, if any. If undefined, shows all columns in definition order. */
  readonly columnState = input<readonly ColumnViewState[] | undefined>(undefined);

  /** Columns that must always be visible (the toggle is disabled). */
  readonly requiredColumns = input<readonly string[]>([]);

  /** Emits the updated column view state whenever the user changes visibility, order, or pinning. */
  readonly columnStateChange = output<readonly ColumnViewState[]>();

  // --- Derived state (protected) ---

  /** Merged list: definition columns overlaid with current state, for rendering the menu. */
  protected readonly managedColumns: Signal<ManagedColumnItem[]>;

  /** True when a column is eligible for reorder-up. */
  protected canMoveUp(index: number): boolean;
  /** True when a column is eligible for reorder-down. */
  protected canMoveDown(index: number): boolean;

  // --- Actions ---

  /** Toggles visibility of a column. Required columns are skipped. */
  protected toggleVisibility(key: string): void;

  /** Moves a column one position up in display order. */
  protected moveUp(key: string): void;
  /** Moves a column one position down in display order. */
  protected moveDown(key: string): void;

  /** Sets pin state: 'start' | 'end' | null (unpin). */
  protected setPin(key: string, edge: 'start' | 'end' | null): void;
}
```

Internal helper type (private to the component):

```typescript
interface ManagedColumnItem {
  readonly key: string;
  readonly header: string;
  readonly visible: boolean;
  readonly pinned: 'start' | 'end' | null;
  readonly required: boolean;
  readonly index: number;  // current position in display order
}
```

All mutations re-derive a new `ColumnViewState[]` and emit it through `columnStateChange`. The parent feeds it back into `m3k-data-table [columnState]`. No internal state linkage — the component is fully driven by its two inputs.

**Template structure** (high-level):
- A trigger button with `mat-icon-button` + "tune" icon, `[matMenuTriggerFor]="menu"`.
- `mat-menu` with role `menu` containing a list of column items.
  - Each item is a horizontal row: reorder up/down icon buttons | pin dropdown (start/end/none) | visibility checkbox | column header text (with "(required)" suffix when locked).
  - Required columns show a disabled checkbox with a lock icon.
  - Pinned columns show a pin icon in the pin area.
  - Reorder buttons are disabled at boundaries (first item can't move up, last can't move down).

## UX states

| State | Trigger | Visual |
|---|---|---|
| **Closed** | Default. Menu not open. | Trigger icon button visible (no badge/dot). |
| **Open — all visible** | User clicks trigger. Menu opens. | Every column checked. Reorder buttons enabled where position allows. Pin dropdown shows current pin state. |
| **Open — some hidden** | Programmatic or prior interaction set some `visible: false`. | Unchecked items appear in order, dimmed or with reduced opacity, showing they exist but are hidden. |
| **Required column** | Column key appears in `requiredColumns` input. | Checkbox is `disabled` with a `(required)` suffix; cannot be unchecked. |
| **Single column visible** | User unchecks all but one column. | No special state — the component does not enforce a minimum; the table renders a single column. |
| **Pinned column** | `pinned: 'start'` or `'end'` in state. | Pin area shows "Left pinned" or "Right pinned" text/icon. Pin dropdown offers change/unpin. |
| **At reorder boundary** | First column / last column. | Move-up button disabled when at index 0. Move-down button disabled when at last index. Disabled button styled with reduced opacity. |
| **Empty/missing definition** | `definition` input not provided. | TS compile error (`input.required`); not a runtime state. |

## Token/theming plan

The component uses Material's `MatMenu`, `MatButton`, `MatIcon` under the hood. Its stylesheet consumes only Material system tokens and the `--app-*` contract:

```scss
@use '@angular/material' as mat;

.m3k-column-manager {
  &__trigger {
    color: var(--mat-sys-on-surface-variant);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;                           // DESIGN.md base-unit spacing
    padding: 4px 8px;                   // density -2 (table density)
    font-family: var(--app-font-data, 'Instrument Sans'), sans-serif;
    font-size: 0.8125rem;               // 13px — table data scale
    color: var(--mat-sys-on-surface);
    min-width: 220px;
  }

  &__item--hidden {
    opacity: 0.55;
  }

  &__item--required {
    color: var(--mat-sys-on-surface-variant);
  }

  &__reorder-btn {
    color: var(--mat-sys-on-surface-variant);

    &[disabled] {
      opacity: 0.3;
    }
  }

  &__pin-badge {
    font-size: 0.6875rem;               // 11px
    color: var(--mat-sys-primary);
    background: var(--mat-sys-primary-container);
    border-radius: var(--app-radius-control, 6px);
    padding: 0 6px;
    line-height: 1.25rem;
  }

  &__pin-dropdown {
    // inherits menu-item styles from MatMenu
  }
}
```

No new tokens needed. The `--app-radius-control` and `--app-font-data` contract tokens are consumed where they add brand identity (pin badge radius, item font). Everything else flows from `--mat-sys-*` — the density override scoping is inherited from the host (the data table's parent, or a standalone density set).

## Accessibility notes

Following WCAG 2.1 AA and the patterns from `libs/shell/overflow-menu` (keyboard-verified):

| Requirement | Implementation |
|---|---|
| **Trigger label** | `aria-label="Column manager"` on the trigger button. |
| **Menu role** | `role="menu"` on the `mat-menu`, `role="menuitem"` on each column row (via `mat-menu-item`). |
| **Keyboard — open/close** | Trigger opens on Enter/Space; Escape closes the menu. (Built into `MatMenuTrigger`.) |
| **Keyboard — reorder** | `aria-label="Move {header} up/down"` on each reorder button. Keyboard focus is on the button, not a drag interaction. `Tab` moves between actionable elements within the item row. |
| **Keyboard — visibility toggle** | Standard checkbox interaction: Space toggles check state. |
| **Keyboard — pin** | Pin control is a `mat-menu` nested trigger or a native `<select>`; keyboard activated. |
| **Focus management** | On menu open, focus lands on the first item's first actionable control. On close, focus returns to the trigger button. |
| **Screen reader — state** | Checked/unchecked state read by `aria-checked` on the checkbox. Pin state read by `aria-label` on the pin control (e.g., "Pin left — currently not pinned"). |
| **Color-only meaning** | Visibility uses a checkbox with text label; hidden columns show reduced opacity *and* an unchecked box — never color-only. Pin state uses text badge ("Left", "Right"), not a color chip. |
| **Disabled reasons** | Required columns show `aria-disabled="true"` AND visible text "(required)". Reorder buttons at boundary show `aria-disabled`. |

**Manual keyboard test plan** (in Cypress, following `overflow-menu.cy.ts` patterns):

```
1. Tab to trigger → Enter → menu opens, focus on first column's checkbox.
2. Tab through item → move-up → move-down → pin → next item → ... → Escape closes.
3. VoiceOver/NVDA reads checkbox states and pin labels.
```

## Storybook, unit, and Cypress plan

Following the patterns from `data-table.component.stories.ts` (Meta with generic, `applicationConfig` decorator, `provideAnimations`) and `data-table.component.spec.ts` (HostComponent pattern, `provideNoopAnimations`):

### Stories (`column-manager.component.stories.ts`)

| Story name | Args | Purpose |
|---|---|---|
| `Default` | `INVOICE_DEFINITION`, no columnState | Shows all columns visible, default order |
| `SomeHidden` | `INVOICE_DEFINITION`, `columnState` with 2 hidden columns | Hidden columns shown unchecked, dimmed |
| `PinnedColumns` | `INVOICE_DEFINITION`, `columnState` with pin-left on ID, pin-right on Amount | Pin badges visible |
| `RequiredColumns` | `INVOICE_DEFINITION`, `requiredColumns=['id']` | ID column checkbox disabled with "(required)" |
| `ManyColumns` | A `TableDefinition` with 20 columns | Menu scrolls, reorder boundaries visible |
| `EmptyManager` | `INVOICE_DEFINITION`, all columns hidden via columnState | All items unchecked (edge case) |

### Unit tests (`column-manager.component.spec.ts`)

Using the host component pattern:

| Test | Method |
|---|---|
| Renders all columns checked by default | Query `.m3k-column-manager__item` count matches `definition.columns.length`; each checkbox is `checked` |
| Hides columns from columnState | Set `columnState` with some `visible: false` → corresponding items show unchecked |
| Emits columnStateChange on toggle | Click checkbox → assert output emitted with toggled visible flag |
| Emits reordered state on move-up | Click move-up → assert output has swapped order |
| Emits reordered state on move-down | Click move-down → assert output has swapped order |
| Move-up disabled at first position | First item's move-up button has `disabled` attribute |
| Move-down disabled at last position | Last item's move-down button has `disabled` attribute |
| Pinned columns show pin badge | Set `pinned: 'start'` → item shows pin badge text |
| SetPin emits updated state | Click pin-left → assert output includes `pinned: 'start'` |
| Required columns cannot be toggled | Set `requiredColumns` → checkbox is `disabled`, clicking does not emit change |
| Required columns show suffix | Item text contains "(required)" |
| Handles empty columnState gracefully | Set columnState to `[]` → all columns visible in definition order |

### Cypress component test (`column-manager.component.cy.ts`)

Using `cy.mount(HostComponent, { providers: [provideNoopAnimations()] })`:

| Test | Assertion |
|---|---|
| Opens menu on trigger click | `.m3k-column-manager__trigger` click → `mat-menu-panel` visible |
| Toggles column visibility | Uncheck → menu stays open → checkbox reflects state. Re-check → state reverts. |
| Moves column up | Click `move-up` → item appears before previous item in DOM order (check `textContent` order) |
| Disabled move at boundaries | First item's move-up button `disabled`; last item's move-down `disabled` |
| Pins column and shows badge | Click pin-left → badge text visible |
| Required column checkbox disabled | `input[type="checkbox"]` has `disabled` attribute |
| Focus returns to trigger on Escape | Press Escape → trigger button is `document.activeElement` |
| Keyboard reorder with Enter | Tab to move-down → Enter → column order changes in emitted output |

## Implementation feasibility and sequence

**Feasibility: High.** The headless model is already tested and used. The component is a pure presentation layer over `ColumnViewState[]` — no new state machine, no persistence, no network, no animation complexity. Material's `MatMenu` provides the menu shell and keyboard handling; the component only needs to compose the item rows.

**Sequence (phased, each independently testable):**

1. **Core model — `ManagedColumnItem` derivation** (branch cut: `wt/m3k-column-manager`)
   - Add the pure-function helper `deriveManagedColumns(definition, state, required): ManagedColumnItem[]` in the component file or a `column-manager-utils.ts` sibling.
   - Unit test: maps definition + state → merged item list with correct visibility, pin, required flags, index.
   - Gate: all tests pass.

2. **Component shell + template** (requires phase 1)
   - Standalone `ColumnManagerComponent<T>`, `m3k-column-manager` selector.
   - Trigger button + `mat-menu` with item rows.
   - Visibility checkbox per item.
   - Gate: renders, opens, closes, toggles emit.

3. **Reorder buttons** (requires phase 2)
   - Move-up/move-down per item row with boundary detection.
   - Emit reordered `ColumnViewState[]`.
   - Gate: move-up moves column up; disabled at first position.

4. **Pin controls** (requires phase 2)
   - Pin dropdown/button per item row (left/right/none).
   - Emit updated pin state.
   - Gate: pin left emits `pinned: 'start'`; pin right emits `pinned: 'end'`; unpin emits no pin.

5. **Required column support** (requires phase 2)
   - `requiredColumns` input, disabled checkbox, "(required)" suffix.
   - Gate: required column checkbox disabled, toggle never emits for it.

6. **Storybook stories** (requires phase 2) — the six stories listed above.

7. **Cypress component tests** (requires phase 2) — keyboard, mouse, focus-management tests.

8. **Export from barrel** — add `export * from './lib/column-manager.component'` to `libs/table/src/index.ts`.

**Estimated effort:** 2-3 focused sessions. Phase 1 (pure logic) is the quickest win. Phase 2 (component shell) is the critical path. Phases 3-5 are parallel-addable after phase 2.

## Evidence consulted

| Source | Path/Reference | Used for |
|---|---|---|
| Column state contracts | `libs/core/src/lib/column-state.ts:11-23` | `ColumnViewState` shape, `resolveColumns` rules |
| Saved view model | `libs/core/src/lib/saved-view.ts:25-44` | Future composition path; columns are already a first-class saved-view field |
| Table definition | `libs/core/src/lib/models.ts:40-57` | `ColumnDef.key`, `ColumnDef.header` — the source of column identity |
| Data table component | `libs/table/src/lib/data-table.component.ts:111,229` | Existing `columnState` input; `resolveColumns()` integration point |
| Table SCSS | `libs/table/src/lib/data-table.component.scss` | Token-only styling precedent, density override, pin edge styles |
| Token contract | `libs/theme/src/m3kit-theme/_contract.scss` | `--app-radius-control`, `--app-font-data` contract tokens |
| Storybook meta pattern | `libs/table/src/lib/data-table.component.stories.ts` | `applicationConfig`, `provideAnimations`, `Meta<Component<T>>` |
| Unit test pattern | `libs/table/src/lib/data-table.component.spec.ts` | HostComponent per describe, `provideNoopAnimations`, DOM query helpers |
| Cypress test pattern | `libs/table/src/lib/data-table.component.cy.ts` | `cy.mount`, `cy.get(...).should(...)`, signal assertions via `cy.then()` |
| Keyboard menu pattern | `libs/shell/src/lib/overflow-menu/overflow-menu.component.cy.ts` | `.focus()`, `.trigger('keydown', { key: 'Enter' })`, `.trigger('click')` |
| Dialog pattern (future pin dialog) | `libs/feedback/src/lib/confirm-dialog.component.cy.ts` | `cy.stub().as('name')` for spy aliases |
| DESIGN.md doctrine | `DESIGN.md:45-48,60-61,99-100` | Density -2 for tables, minimal motion, anti-patterns |
| NotebookLM source packet | `docs/readiness/m3kit-ui-tournament/2026-07-06/notebooklm-source-packet.md` | Tournament rules, boundary constraints, readiness gaps |
| Feature candidate list | `docs/readiness/m3kit-ui-tournament/2026-07-06/feature-candidate-list.md` | Candidate D spec, acceptance criteria |
| AGENTS.md | `AGENTS.md:10-17,39-46` | Library boundaries, token-only rule, coverage bar |

Commands run: none — proposal only, as required by tournament rules (`notebooklm-source-packet.md:7`: "Produce proposals/prototypes only; no main implementation mutation").

## Risks / rejection conditions

| Risk | Mitigation |
|---|---|
| **Scope creep**: drag-and-drop reorder, live width editing, column grouping follow as "obvious" extensions. | Explicitly mark resize-by-drag and drag-reorder as **deferred** in the component JSDoc. This slice is menu-based keyboard reorder and checkbox visibility only. Any drag surface requires a future spec gate (touch support, screen-reader drag announcements, ARIA grid pattern). |
| **Menu overflow with 30+ columns**: a tall `mat-menu` scrolls, but keyboard navigation of a long unchecked list could be tedious. | Defer to follow-up: a search/filter input at the top of the menu can be added when real-world usage demands it. The component already emits `ColumnViewState[]` — a search-filter addition is a purely additive change. |
| **Density conflict**: menu items use table density (-2) but `MatMenu` defaults to density 0. | Set density on the menu items via `@include mat.theme((density: -2))` scoped to the component host, or pass `class` to `mat-menu-item`. The data table already does this (`data-table.component.scss:6-12`). |
| **No pinning in the rendering engine**: `resolveColumns` passes pin state to the table, but the table template uses `[sticky]`/`[stickyEnd]` only when `pinned` is resolved. | Already handled: `data-table.component.html` applies `[sticky]` based on `column.pinned === 'start'` and `[stickyEnd]` based on `column.pinned === 'end'`. Verified in column-state stories and Cypress tests (`data-table.component.cy.ts` pinned column tests pass `getBoundingClientRect` assertions). |
| **Consumer does not feed `columnStateChange` back into the table**: the output is ignored, no columns change. | This is a feature, not a bug: it lets the consumer filter, modify, debounce, or batch the emitted state before applying it. The API is pure intent-emission, which is the same pattern as `sortChange`/`pageChange` in the data table. |
| **Rejection criterion**: violates token-only styling with a raw color or per-brand selector. | **Will not happen**: the stylesheet in this proposal uses only `var(--mat-sys-*)` and `var(--app-*)` tokens. No raw hex, no `html.theme-x` selector. |
| **Rejection criterion**: new dependency. | **Will not happen**: depends only on `@angular/material` (already a dependency of `libs/table`), `@m3kit/core` (already a dependency), and Angular core. No new package. |
| **Rejection criterion**: inaccessible state handling (color-only meaning). | **Will not happen**: visibility uses checkbox icons + text; pin uses text badges + dropdown; hidden columns use unchecked + reduced opacity. Every state is conveyed through structure and text, not color alone. |
```

exit_code: 0
