import type { ColumnViewState } from './column-state';
import type { TableDefinition } from './models';
import type { DataQuery, SortState } from './query';
import {
  deserializeDataQuery,
  type SerializedDataQuery,
} from './query-serialization';

/**
 * Current schema version stamped onto every {@link SavedView}. Older
 * persisted views migrate forward through {@link parseSavedView}'s
 * migration hook; views from a higher (unknown future) version are
 * rejected rather than half-applied.
 */
export const SAVED_VIEW_SCHEMA_VERSION = 1;

/**
 * A named, versioned report view: a serialized query snapshot plus an
 * optional column view state, addressed to one report.
 *
 * `SavedView` is a pure contract — persistence (localStorage, REST,
 * IndexedDB) is consumer/adapter code, not core. Timestamps are ISO 8601
 * strings so the model serializes as-is.
 */
export interface SavedView {
  /** Schema version of this record (see {@link SAVED_VIEW_SCHEMA_VERSION}). */
  readonly version: number;
  /** Id of the `TableDefinition` this view applies to. */
  readonly reportId: string;
  /** Stable unique identifier of the view itself. */
  readonly viewId: string;
  /** Human-readable view name. */
  readonly name: string;
  /** Optional longer description. */
  readonly description?: string;
  /** Serialized query snapshot the view restores. */
  readonly query: SerializedDataQuery;
  /** Optional column view state (visibility/order/pinning/width). */
  readonly columns?: readonly ColumnViewState[];
  /** Creation instant, ISO 8601. */
  readonly createdAt: string;
  /** Last-update instant, ISO 8601. */
  readonly updatedAt: string;
}

/** Caller-supplied fields for {@link createSavedView}. */
export interface CreateSavedViewInput {
  readonly reportId: string;
  readonly viewId: string;
  readonly name: string;
  readonly description?: string;
  readonly query: SerializedDataQuery;
  readonly columns?: readonly ColumnViewState[];
}

/**
 * The result of applying a {@link SavedView} against a definition: the
 * deserialized, definition-validated query plus the column state to hand
 * to the renderer (present only when the view carries one).
 */
export interface AppliedSavedView {
  readonly query: DataQuery;
  readonly columns?: readonly ColumnViewState[];
}

/**
 * Creates a {@link SavedView}, stamping the current schema version and
 * `createdAt`/`updatedAt` from `now` (injectable for deterministic
 * fixtures/specs; defaults to the current instant).
 */
export function createSavedView(
  input: CreateSavedViewInput,
  now: Date = new Date(),
): SavedView {
  const at = now.toISOString();
  return {
    version: SAVED_VIEW_SCHEMA_VERSION,
    reportId: input.reportId,
    viewId: input.viewId,
    name: input.name,
    ...(input.description !== undefined ? { description: input.description } : {}),
    query: input.query,
    ...(input.columns !== undefined ? { columns: input.columns } : {}),
    createdAt: at,
    updatedAt: at,
  };
}

/**
 * Validates unknown input (parsed JSON from storage, a URL, user files)
 * into a {@link SavedView}. Never throws.
 *
 * - Older schema versions migrate forward through the single migration
 *   hook (v1 is current, so no migrations exist yet).
 * - Future (higher) versions return `null` — never half-applied.
 * - Structurally invalid input — wrong field types, an embedded query
 *   that itself fails `deserializeDataQuery` — returns `null`.
 */
export function parseSavedView(input: unknown): SavedView | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }
  let candidate = input as Record<string, unknown>;

  const version = candidate['version'];
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    return null;
  }
  if (version > SAVED_VIEW_SCHEMA_VERSION) {
    return null;
  }
  if (version < SAVED_VIEW_SCHEMA_VERSION) {
    const migrated = migrateSavedView(candidate, version);
    if (migrated === null) {
      return null;
    }
    candidate = migrated;
  }

  const reportId = candidate['reportId'];
  const viewId = candidate['viewId'];
  const name = candidate['name'];
  const description = candidate['description'];
  const createdAt = candidate['createdAt'];
  const updatedAt = candidate['updatedAt'];
  const columns = candidate['columns'];

  if (
    !isNonEmptyString(reportId) ||
    !isNonEmptyString(viewId) ||
    !isNonEmptyString(name) ||
    (description !== undefined && typeof description !== 'string') ||
    !isIsoInstant(createdAt) ||
    !isIsoInstant(updatedAt) ||
    (columns !== undefined && !isColumnViewStateArray(columns))
  ) {
    return null;
  }

  // The embedded query must itself be a valid (current or migratable)
  // serialized query; it is kept in serialized form and deserialized at
  // apply time.
  if (deserializeDataQuery(candidate['query']) === null) {
    return null;
  }
  const query = candidate['query'] as SerializedDataQuery;

  return {
    version: SAVED_VIEW_SCHEMA_VERSION,
    reportId,
    viewId,
    name,
    ...(description !== undefined ? { description } : {}),
    query,
    ...(columns !== undefined ? { columns } : {}),
    createdAt,
    updatedAt,
  };
}

/**
 * Applies a {@link SavedView} against the report definition it targets,
 * validating along the way:
 *
 * - A `reportId` mismatch returns `null` — views never apply across
 *   reports.
 * - An embedded query that fails to deserialize returns `null`.
 * - A sort whose key is absent from the definition's columns falls back
 *   to `definition.defaultSort ?? null`.
 * - Column entries whose keys are absent from the definition drop; the
 *   rest of the view still applies.
 */
export function applySavedView<T>(
  view: SavedView,
  definition: TableDefinition<T>,
): AppliedSavedView | null {
  if (view.reportId !== definition.id) {
    return null;
  }

  const deserialized = deserializeDataQuery(view.query);
  if (deserialized === null) {
    return null;
  }

  const knownKeys = new Set<string>(definition.columns.map((column) => column.key));

  const sort =
    deserialized.sort !== null && !knownKeys.has(deserialized.sort.key)
      ? defaultSortOf(definition)
      : deserialized.sort;
  const query: DataQuery = sort === deserialized.sort ? deserialized : { ...deserialized, sort };

  if (view.columns === undefined) {
    return { query };
  }
  return {
    query,
    columns: view.columns.filter((entry) => knownKeys.has(entry.key)),
  };
}

/**
 * Migration hook for pre-current saved-view schema versions. v1 is the
 * first schema, so no migrations exist yet; future versions add a case
 * per superseded version (e.g. v1 → v2 introducing a density field) and
 * chain forward. Unknown old versions are unusable: `null`.
 */
function migrateSavedView(
  candidate: Record<string, unknown>,
  version: number,
): Record<string, unknown> | null {
  switch (version) {
    default:
      return null;
  }
}

/**
 * Widens a definition's `SortState<T>` default sort to the untyped
 * `DataQuery` sort shape (`keyof T & string` is a `string` at runtime; the
 * literal rebuild keeps the generic out of the variance check).
 */
function defaultSortOf<T>(definition: TableDefinition<T>): SortState | null {
  return definition.defaultSort !== undefined
    ? { key: definition.defaultSort.key, direction: definition.defaultSort.direction }
    : null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isIsoInstant(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isColumnViewStateArray(value: unknown): value is readonly ColumnViewState[] {
  return Array.isArray(value) && value.every(isColumnViewState);
}

function isColumnViewState(value: unknown): value is ColumnViewState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate['key']) &&
    (candidate['visible'] === undefined || typeof candidate['visible'] === 'boolean') &&
    (candidate['pinned'] === undefined ||
      candidate['pinned'] === 'start' ||
      candidate['pinned'] === 'end') &&
    (candidate['width'] === undefined || typeof candidate['width'] === 'string')
  );
}
