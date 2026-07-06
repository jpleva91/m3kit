# Contestant Entry: Antigravity / Gemini 3.5 Flash (Medium)

This packet details the proposal for the **Data Table Column Manager (`m3k-column-manager`)** component for `m3kit`.

---

## Selected feature

* **Component Selector**: `m3k-column-manager`
* **Target Library**: `libs/table` (`@m3kit/table`)
* **Underlying Contracts**: Extends and integrates with the existing `TableDefinition<T>` and `ColumnViewState` from `libs/core`.
* **Summary**: A client-side, brand-neutral, keyboard-accessible UI widget that allows enterprise dashboard users to dynamically toggle column visibility, reorder columns, and pin them to the start or end of the viewport. It emits updated `ColumnViewState[]` changes, which are fed back to the `m3k-data-table`'s `[columnState]` input.

---

## Why this wins for m3kit readiness

1. **Closes a Major Table Parity Gap**: Enterprise users inspecting `m3kit` as a reference library expect robust table management (comparable to AG Grid or PrimeNG) out of the box. While the table engine already supports headless `ColumnViewState` and `resolveColumns` dynamically, there is no UI to configure this.
2. **High ROI / Low-Risk Seam**:
   * **Zero new dependencies**: Uses standard Angular and Angular Material modules (`MatCheckboxModule`, `MatButtonModule`, `MatIconModule`).
   * **Integrates with existing state**: Hooks directly into the `SavedView` contract, enabling users to save customized column visibility/orders into named dashboard views without introducing database or endpoint assumptions.
3. **Refinement and Quality**: Enforces strict accessibility (keyboard-driven reordering and clear ARIA descriptions) rather than a mouse-only drag-and-drop mechanism. It handles edge cases like preventing hiding all columns and managing immutable/locked columns.

---

## Component API sketch

### TypeScript Definition (`column-manager.component.ts`)

```typescript
import { 
  ChangeDetectionStrategy, 
  Component, 
  computed, 
  input, 
  output, 
  linkedSignal 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { 
  TableDefinition, 
  ColumnViewState, 
  resolveColumns 
} from '@m3kit/core';

@Component({
  selector: 'm3k-column-manager',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './column-manager.component.html',
  styleUrl: './column-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnManagerComponent<T> {
  /** The declarative report definition driving the primary column set. */
  readonly definition = input.required<TableDefinition<T>>();

  /** The current external view state containing visibility, pinning, and ordering overrides. */
  readonly columnState = input<readonly ColumnViewState[] | undefined>(undefined);

  /** Keys of columns that are locked and cannot be hidden, reordered, or pinned. */
  readonly lockedKeys = input<readonly string[]>([]);

  /** Emits an updated `ColumnViewState[]` whenever the user alters visibility, ordering, or pinning. */
  readonly columnStateChange = output<readonly ColumnViewState[]>();

  /**
   * Internal reactive state tracking the columns. 
   * Synchronizes with inputs while maintaining a working list.
   */
  protected readonly localState = linkedSignal<{
    definition: TableDefinition<T>;
    state: readonly ColumnViewState[] | undefined;
  }, ColumnViewState[]>({
    source: () => ({ definition: this.definition(), state: this.columnState() }),
    computation: (source) => {
      const resolved = resolveColumns(source.definition.columns, source.state);
      const stateMap = new Map(source.state?.map(s => [s.key, s]) ?? []);
      const allKeys = new Set(source.definition.columns.map(c => c.key));
      const list: ColumnViewState[] = [];

      // 1. Append currently visible resolved columns
      for (const col of resolved) {
        const entry = stateMap.get(col.def.key);
        list.push({
          key: col.def.key,
          visible: entry?.visible ?? true,
          pinned: col.pinned,
          width: col.width
        });
        allKeys.delete(col.def.key);
      }

      // 2. Append hidden/unresolved columns in definition order
      for (const defCol of source.definition.columns) {
        if (allKeys.has(defCol.key)) {
          const entry = stateMap.get(defCol.key);
          list.push({
            key: defCol.key,
            visible: false,
            pinned: entry?.pinned,
            width: entry?.width
          });
        }
      }
      return list;
    }
  });

  /** Returns number of currently visible columns to enforce 'all-hidden disallowed' safety rule. */
  protected readonly visibleCount = computed(() => 
    this.localState().filter(col => col.visible !== false).length
  );

  protected isColumnLocked(key: string): boolean {
    return this.lockedKeys().includes(key);
  }

  protected getHeaderLabel(key: string): string {
    const col = this.definition().columns.find(c => c.key === key);
    return col ? col.header : key;
  }

  protected toggleVisibility(index: number): void {
    const list = [...this.localState()];
    const item = list[index];
    if (this.isColumnLocked(item.key)) return;

    const nextVisible = item.visible === false;
    if (!nextVisible && this.visibleCount() <= 1) return; // Prevent total column blackout

    list[index] = { ...item, visible: nextVisible };
    this.localState.set(list);
    this.emitChange(list);
  }

  protected togglePin(index: number, edge: 'start' | 'end'): void {
    const list = [...this.localState()];
    const item = list[index];
    if (this.isColumnLocked(item.key)) return;

    const nextPinned = item.pinned === edge ? undefined : edge;
    list[index] = { ...item, pinned: nextPinned };
    this.localState.set(list);
    this.emitChange(list);
  }

  protected moveUp(index: number): void {
    if (index === 0) return;
    this.swap(index, index - 1);
  }

  protected moveDown(index: number): void {
    if (index === this.localState().length - 1) return;
    this.swap(index, index + 1);
  }

  protected reset(): void {
    this.localState.set([]);
    this.columnStateChange.emit([]);
  }

  private swap(i: number, j: number): void {
    const list = [...this.localState()];
    if (this.isColumnLocked(list[i].key) || this.isColumnLocked(list[j].key)) return;

    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;

    this.localState.set(list);
    this.emitChange(list);
  }

  private emitChange(list: readonly ColumnViewState[]): void {
    // Only emit state overrides (omit default attributes to keep saved views compact)
    const emitted = list.map(item => {
      const state: ColumnViewState = { key: item.key };
      if (item.visible === false) state.visible = false;
      if (item.pinned) state.pinned = item.pinned;
      if (item.width) state.width = item.width;
      return state;
    });
    this.columnStateChange.emit(emitted);
  }
}
```

### Component Template (`column-manager.component.html`)

```html
<div class="m3k-column-manager">
  <div class="m3k-column-manager__header">
    <span class="m3k-column-manager__title">Manage Columns</span>
    <button mat-icon-button (click)="reset()" aria-label="Reset to default layout">
      <mat-icon>restart_alt</mat-icon>
    </button>
  </div>

  <ul class="m3k-column-manager__list" role="listbox" aria-label="Table columns configuration">
    @for (item of localState(); track item.key; let idx = $index; let first = $first; let last = $last) {
      @let isLocked = isColumnLocked(item.key);
      @let label = getHeaderLabel(item.key);
      @let isVisible = item.visible !== false;

      <li class="m3k-column-manager__item"
          [class.m3k-column-manager__item--locked]="isLocked"
          [class.m3k-column-manager__item--hidden]="!isVisible"
          role="option"
          [attr.aria-selected]="isVisible">
        
        <!-- Toggle Switch Checkbox -->
        <mat-checkbox 
          [checked]="isVisible" 
          [disabled]="isLocked || (isVisible && visibleCount() <= 1)"
          (change)="toggleVisibility(idx)">
          <span class="m3k-column-manager__item-label">{{ label }}</span>
          @if (isLocked) {
            <span class="m3k-column-manager__locked-badge" aria-hidden="true">(Locked)</span>
          }
        </mat-checkbox>

        <span class="m3k-column-manager__spacer"></span>

        <!-- Pin Controls -->
        <div class="m3k-column-manager__pinning" role="group" [attr.aria-label]="label + ' pinning options'">
          <button mat-icon-button
                  [disabled]="isLocked || !isVisible"
                  (click)="togglePin(idx, 'start')"
                  [class.m3k-column-manager__pin-btn--active]="item.pinned === 'start'"
                  [aria-label]="'Pin ' + label + ' to start'">
            <mat-icon>keyboard_double_arrow_left</mat-icon>
          </button>
          <button mat-icon-button
                  [disabled]="isLocked || !isVisible"
                  (click)="togglePin(idx, 'end')"
                  [class.m3k-column-manager__pin-btn--active]="item.pinned === 'end'"
                  [aria-label]="'Pin ' + label + ' to end'">
            <mat-icon>keyboard_double_arrow_right</mat-icon>
          </button>
        </div>

        <!-- Keyboard Reordering (A11y Compliant) -->
        <div class="m3k-column-manager__order" role="group" [attr.aria-label]="label + ' ordering'">
          <button mat-icon-button
                  [disabled]="isLocked || first"
                  (click)="moveUp(idx)"
                  [aria-label]="'Move column ' + label + ' up'">
            <mat-icon>arrow_upward</mat-icon>
          </button>
          <button mat-icon-button
                  [disabled]="isLocked || last"
                  (click)="moveDown(idx)"
                  [aria-label]="'Move column ' + label + ' down'">
            <mat-icon>arrow_downward</mat-icon>
          </button>
        </div>
      </li>
    }
  </ul>
</div>
```

### Component Stylesheet (`column-manager.component.scss`)

```scss
:host {
  display: block;
  min-width: 320px;
  background: var(--mat-sys-surface-container);
  border-radius: var(--app-radius-card, 8px);
  border: 1px solid var(--mat-sys-outline-variant);
  box-sizing: border-box;
}

.m3k-column-manager {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--mat-sys-outline-variant);
    margin-bottom: 0.5rem;
  }

  &__title {
    font-family: var(--mat-sys-label-large-font, 'Instrument Sans'), sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: var(--app-radius-control, 6px);
    transition: background 0.1s ease;

    &:hover:not(&--locked) {
      background: var(--mat-sys-surface-container-high);
    }

    &--hidden {
      opacity: 0.5;
    }
  }

  &__item-label {
    font-family: var(--mat-sys-body-medium-font, 'Instrument Sans'), sans-serif;
    font-size: 0.8125rem;
    color: var(--mat-sys-on-surface);
  }

  &__locked-badge {
    font-size: 0.75rem;
    color: var(--mat-sys-on-surface-variant);
    margin-left: 0.25rem;
    font-style: italic;
  }

  &__spacer {
    flex: 1 1 auto;
  }

  &__pinning,
  &__order {
    display: flex;
    gap: 0.125rem;
    align-items: center;
    margin-left: 0.5rem;
  }

  button[mat-icon-button] {
    width: 28px;
    height: 28px;
    line-height: 28px;

    mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  }

  &__pin-btn--active {
    color: var(--mat-sys-primary); // Brand-level Cobalt
  }
}
```

---

## UX states

1. **Default State**: Columns display in `TableDefinition` order. Checkboxes are active and checked. Pinned and ordering controls are enabled (except boundary arrows on the first/last items).
2. **Hidden (De-selected) State**: Unchecking a column fades its row opacity to `50%` and disables its pinning buttons (since hidden columns cannot be pinned). The checkbox remains interactive so the user can re-add it.
3. **Pinned State**: Clicking the start or end pinning buttons lights them up in the active brand color (`var(--mat-sys-primary)`). The table immediately pins these columns sticky in the grid layout.
4. **All-Hidden Disallowed State**: If only a single column remains visible, its checkbox is locked/disabled. This prevents the user from completely blacking out the table grid, which leads to empty layout frames.
5. **Locked Column State**: Designated identifier columns (like `ID` or `Status`) can be set to `locked`. They display a small `(Locked)` label, their checkbox is disabled and permanently checked, and their pinning/ordering buttons are disabled.
6. **Multi-Brand Visual Mapping**:
   * **Instruments (Default)**: Steel surface container, clean borders, bright cobalt blue active highlights.
   * **Terminal**: Phosphor green highlight text, amber warnings, sharp 90-degree corners, monospace layout keys.
   * **Brutalist**: Raw white and heavy ink black borders, zero curvature (`border-radius: 0`), primary red status indications.
   * **Meadow**: Soft lavender checkboxes, highly rounded controls, gentle transition timings.

---

## Token/theming plan

This component relies strictly on the `--mat-sys-*` and `--app-*` contracts defined in `libs/theme/src/m3kit-theme/_contract.scss`. It contains absolutely zero hardcoded colors or direct brand selectors.

* **Typography**:
  * Title: `var(--mat-sys-label-large-font)` mapping to `Instrument Sans`.
  * Label: `var(--mat-sys-body-medium-font)` mapping to `Instrument Sans`.
  * Mono variables (if displaying field keys): `var(--app-font-data)` mapping to `JetBrains Mono`.
* **Colors**:
  * Primary highlight: `var(--mat-sys-primary)` (Cobalt in Instruments, Green in Terminal, Oxblood in Ledger).
  * Surface backing: `var(--mat-sys-surface-container)` and `var(--mat-sys-surface-container-high)`.
  * Boundaries/Dividers: `var(--mat-sys-outline-variant)`.
* **Radii**:
  * Outer frame: `var(--app-radius-card)` (typically 8px).
  * Items and buttons: `var(--app-radius-control)` (typically 6px, but 0px for Gazette/Brutalist and 999px for Pop).

---

## Accessibility notes

To prevent screen-reader traps and accommodate keyboard-only users, this component abandons "drag-only" reordering in favor of keyboard-interactive buttons:

* **ARIA Roles**:
  * Renders list with `role="listbox"` and items with `role="option"` having `[attr.aria-selected]`.
  * Section buttons grouped inside `role="group"` with explicit `aria-label` fields detailing the column name (e.g. `aria-label="Pin column 'Customer' to start"`).
* **Keyboard Navigation**:
  * Buttons are fully focusable and triggerable via `Space`/`Enter`.
  * When a column is moved up or down, focus remains on the clicked button, ensuring the user does not lose their place in the DOM tree.
* **Announcements**:
  * An invisible `aria-live="polite"` region will announce the updated position of a column when moved (e.g., `"Column Amount moved to position 3 of 6"`).

---

## Storybook, unit, and Cypress plan

### Storybook stories (`column-manager.stories.ts`)
* **`Default`**: Standard Invoices table columns configuration.
* **`LockedColumns`**: Scenario showing primary identifiers (e.g., `id` and `date`) locked from removal or reordering.
* **`ManyColumns`**: 15+ column definitions to test container scrolling containment.
* **`Compact`**: Rendered inside a popover dropdown simulation to test narrow-viewport scaling.
* **`ParityGallery`**: Matrix displaying the component side-by-side in all 12 themes × light/dark modes.

### Vitest unit tests (`column-manager.component.spec.ts`)
* **Initialization**: Verify component parses `definition` and `columnState` correctly to build the local array.
* **Reordering**: Mock clicks on `moveUp` / `moveDown` and assert updated index changes in the output state event.
* **Locked Boundary**: Assert locked column indices cannot be swapped or hidden.
* **Blackout Prevention**: Verify checking/unchecking the last visible column is blocked.
* **Reset**: Verify `reset()` triggers emission of `[]` (clearing overrides).

### Cypress component tests (`column-manager.component.cy.ts`)
* **Focus State**: Verify keyboard tab sequence moves sequentially through checkboxes and buttons.
* **DOM Re-ordering**: Simulate clicking "Move Down" and verify the DOM node updates position physically. Focus must remain on the clicked button.
* **Checked States**: Verify clicking checkbox toggles screen-reader attributes (`aria-selected`).

---

## Implementation feasibility and sequence

### Feasibility
**High Feasibility (100%)**. The component uses existing core data models (`TableDefinition`, `ColumnViewState`, `resolveColumns`), introduces no external npm dependencies, and stays entirely inside the library boundary limits of `@m3kit/table`.

### Implementation Sequence
1. **Phase 1: Scaffolding**: Create the directory structure `libs/table/src/lib/column-manager/` and wire exports in `libs/table/src/index.ts`.
2. **Phase 2: Core Logic**: Code the component typescript, using `linkedSignal` to synchronize the incoming props.
3. **Phase 3: Accessibility**: Code the HTML template with proper ARIA bindings and `aria-live` announcements.
4. **Phase 4: Styling**: Implement the SCSS file, checking tokens alignment.
5. **Phase 5: Storybook & Test Suite**: Add story scripts, Vitest specs, and Cypress components tests.
6. **Phase 6: Parity Check**: Verify component rendering across the 12-brand matrix.

---

## Evidence consulted

* **Docs/Specs**:
  * [notebooklm-source-packet.md](file:///home/red/angular-reporting-reference/.worktrees/t_d37c4224/docs/readiness/m3kit-ui-tournament/2026-07-06/notebooklm-source-packet.md) (mission constraints, brand details, gaps).
  * [feature-candidate-list.md](file:///home/red/angular-reporting-reference/.worktrees/t_d37c4224/docs/readiness/m3kit-ui-tournament/2026-07-06/feature-candidate-list.md) (features definitions, Candidate D criteria).
  * [AGENTS.md](file:///home/red/angular-reporting-reference/AGENTS.md) (monorepo boundaries, testing rules).
  * [DESIGN.md](file:///home/red/angular-reporting-reference/DESIGN.md) (brand typography, colors, density scales).
* **Source files**:
  * [column-state.ts](file:///home/red/angular-reporting-reference/libs/core/src/lib/column-state.ts) (verified `ColumnViewState` parameters and how `resolveColumns` processes them).
  * [data-table.component.ts](file:///home/red/angular-reporting-reference/libs/table/src/lib/data-table.component.ts) (verified input structures).
  * [page-toolbar.component.ts](file:///home/red/angular-reporting-reference/libs/table/src/lib/page-toolbar.component.ts) (verified CSS BEM structure & imports patterns).

---

## Risks / rejection conditions

* **Rejection - Drag and Drop Over-engineering**: Introducing complex custom dragging structures (e.g. `@angular/cdk/drag-drop`) increases bundle size and violates the "no-new-dependency/low-complexity" theme unless explicitly validated by a prior ADR. Stick to keyboard-first arrows.
* **Rejection - Hardcoded Visuals**: Hardcoding any color palette (e.g. `#1B4FD8` directly in code) or targetting Material internals directly will fail the tournament.
* **Risk - Table blackouts**: Hiding all columns results in an empty table frame, breaking grid alignment. The UI must prevent users from unchecking the last visible column.
* **Risk - Out of sync definitions**: If table inputs change from the app layer, the local view state could become stale. Mitigated by using Angular 19 `linkedSignal` for reactive resets.
