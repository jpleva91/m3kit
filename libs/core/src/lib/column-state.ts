import type { ColumnDef } from './models';

/**
 * One serializable column adjustment, applied on top of a
 * `TableDefinition`'s columns. Array order is display order: a
 * `ColumnViewState[]` both selects and orders the columns it names.
 *
 * The model is headless by design — saved views, URL state, and app code
 * are the writers; interactive column chrome is a separate concern.
 */
export interface ColumnViewState {
  /** Key of the definition column this entry adjusts. */
  readonly key: string;
  /** Whether the column is shown. Defaults to `true`. */
  readonly visible?: boolean;
  /** Pins the column sticky at the given edge. Unpinned when omitted. */
  readonly pinned?: 'start' | 'end';
  /**
   * CSS width override (e.g. `'120px'`, `'12rem'`). Overrides the
   * definition column's width when present.
   */
  readonly width?: string;
}

/**
 * One column after view-state resolution: the definition column plus the
 * effective pinning and width to render with.
 */
export interface ResolvedColumn<T> {
  /** The underlying definition column. */
  readonly def: ColumnDef<T>;
  /** Effective pinned edge, when pinned. */
  readonly pinned?: 'start' | 'end';
  /** Effective CSS width (state width wins over definition width). */
  readonly width?: string;
}

/**
 * Resolves a `TableDefinition`'s columns against an externally supplied
 * {@link ColumnViewState} array. Pure and total — any state input yields
 * a renderable column list. Resolution rules:
 *
 * - No state (or an empty array entry-set) renders all definition
 *   columns in definition order.
 * - State array order is display order.
 * - Entries whose `key` matches no definition column are dropped.
 * - Duplicate keys are first-wins; later entries are dropped.
 * - Definition columns not named by the state are appended visible, in
 *   definition order, after the stated columns.
 * - `visible: false` removes the column (an all-hidden state resolves to
 *   an empty list — callers render their empty-column frame).
 * - A state `width` overrides the definition column's width; otherwise
 *   the definition width applies.
 */
export function resolveColumns<T>(
  columns: readonly ColumnDef<T>[],
  state?: readonly ColumnViewState[],
): readonly ResolvedColumn<T>[] {
  if (state === undefined) {
    return columns.map((def) => toResolvedColumn(def));
  }

  const byKey = new Map<string, ColumnDef<T>>(
    columns.map((def) => [def.key, def]),
  );
  const seen = new Set<string>();
  const resolved: ResolvedColumn<T>[] = [];

  for (const entry of state) {
    const def = byKey.get(entry.key);
    if (def === undefined || seen.has(entry.key)) {
      continue;
    }
    seen.add(entry.key);
    if (entry.visible === false) {
      continue;
    }
    resolved.push(toResolvedColumn(def, entry));
  }

  for (const def of columns) {
    if (!seen.has(def.key)) {
      resolved.push(toResolvedColumn(def));
    }
  }

  return resolved;
}

function toResolvedColumn<T>(
  def: ColumnDef<T>,
  entry?: ColumnViewState,
): ResolvedColumn<T> {
  const resolved: { def: ColumnDef<T>; pinned?: 'start' | 'end'; width?: string } = { def };
  if (entry?.pinned !== undefined) {
    resolved.pinned = entry.pinned;
  }
  const width = entry?.width ?? def.width;
  if (width !== undefined) {
    resolved.width = width;
  }
  return resolved;
}
