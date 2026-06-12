import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

/** State slice managed by `withSelection`. */
export interface SelectionState {
  /**
   * Identities of the selected rows, as produced by the feature's `idOf`
   * extractor. Treated as immutable: every mutation replaces the set.
   */
  selectedIds: ReadonlySet<unknown>;
}

function toRows<T>(rows: T | readonly T[]): readonly T[] {
  return Array.isArray(rows) ? rows : [rows as T];
}

/**
 * SignalStore feature for row selection keyed by identity rather than by
 * object reference, so selection survives refetches that produce new row
 * instances.
 *
 * ```ts
 * const InvoiceStore = signalStore(
 *   withDataQuery<Invoice>(),
 *   withSelection<Invoice>((invoice) => invoice.id),
 * );
 *
 * store.toggle(row);
 * store.isSelected()(row); // computed predicate
 * ```
 *
 * @param idOf Extracts the stable identity of a row (e.g. `(r) => r.id`).
 */
export function withSelection<T>(idOf: (row: T) => unknown) {
  return signalStoreFeature(
    withState<SelectionState>({ selectedIds: new Set<unknown>() }),
    withComputed(({ selectedIds }) => ({
      /**
       * Predicate over rows: `store.isSelected()(row)`. Recomputed only
       * when the selection changes.
       */
      isSelected: computed(() => {
        const ids = selectedIds();
        return (row: T): boolean => ids.has(idOf(row));
      }),
      /** Number of selected rows. */
      selectedCount: computed(() => selectedIds().size),
      /** True when at least one row is selected. */
      hasSelection: computed(() => selectedIds().size > 0),
    })),
    withMethods((store) => ({
      /** Flips the selection state of a single row. */
      toggle(row: T): void {
        const id = idOf(row);
        patchState(store, ({ selectedIds }) => {
          const next = new Set(selectedIds);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return { selectedIds: next };
        });
      },

      /** Adds one row or many rows to the selection. */
      select(rows: T | readonly T[]): void {
        patchState(store, ({ selectedIds }) => {
          const next = new Set(selectedIds);
          for (const row of toRows(rows)) {
            next.add(idOf(row));
          }
          return { selectedIds: next };
        });
      },

      /** Removes one row or many rows from the selection. */
      deselect(rows: T | readonly T[]): void {
        patchState(store, ({ selectedIds }) => {
          const next = new Set(selectedIds);
          for (const row of toRows(rows)) {
            next.delete(idOf(row));
          }
          return { selectedIds: next };
        });
      },

      /** Clears the selection. */
      clear(): void {
        patchState(store, { selectedIds: new Set<unknown>() });
      },
    }))
  );
}
