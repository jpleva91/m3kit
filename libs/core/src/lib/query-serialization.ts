import type { DataQuery, FilterState, SortDirection, SortState } from './query';
import { createDefaultQuery } from './query';

/**
 * Current schema version of {@link SerializedDataQuery}. Bumped on every
 * shape-breaking change, with a matching case added to the migration
 * switch in {@link deserializeDataQuery} so older serialized forms (URLs,
 * saved views, export snapshots) keep loading.
 */
export const DATA_QUERY_SCHEMA_VERSION = 1;

/**
 * Versioned, deterministic wire/storage form of a {@link DataQuery} — the
 * unit of URL state, saved views, export snapshots, and hashing.
 *
 * The envelope is flat and minimal: defaults are omitted (no blank
 * `text`, no empty `fields`, no `null` sort) and properties are written
 * in a fixed order with sorted `fields` keys, so `JSON.stringify`
 * produces identical text for equal queries.
 */
export interface SerializedDataQuery {
  /** Schema version of this envelope (see {@link DATA_QUERY_SCHEMA_VERSION}). */
  readonly v: number;
  /** Free-text filter; omitted when empty or whitespace-only. */
  readonly text?: string;
  /** Per-field exact-match filters; omitted when empty. */
  readonly fields?: Readonly<Record<string, unknown>>;
  /** Active sort; omitted when the query has no sort. */
  readonly sort?: { readonly key: string; readonly dir: SortDirection };
  /** Pagination state (always present). */
  readonly page: { readonly index: number; readonly size: number };
}

/**
 * Recursively canonicalizes a JSON-shaped value: object keys sorted,
 * `undefined`-valued entries dropped, arrays preserved in order. Keeps
 * serialization deterministic regardless of input key insertion order.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      if (record[key] !== undefined) {
        out[key] = canonicalize(record[key]);
      }
    }
    return out;
  }
  return value;
}

/**
 * Serializes a {@link DataQuery} into its versioned, deterministic
 * envelope. Equal queries (after normalization: blank text and
 * `undefined` field values mean "no filter") always produce envelopes
 * whose `JSON.stringify` text is identical.
 */
export function serializeDataQuery(query: DataQuery): SerializedDataQuery {
  // Properties are assigned in a fixed order (v, text, fields, sort,
  // page) so JSON.stringify output is deterministic.
  const out: Record<string, unknown> = { v: DATA_QUERY_SCHEMA_VERSION };
  const text = query.filter.text;
  if (typeof text === 'string' && text.trim() !== '') {
    out['text'] = text;
  }
  if (query.filter.fields !== undefined) {
    const fields = canonicalize(query.filter.fields) as Record<string, unknown>;
    if (Object.keys(fields).length > 0) {
      out['fields'] = fields;
    }
  }
  if (query.sort !== null) {
    out['sort'] = { key: query.sort.key, dir: query.sort.direction };
  }
  out['page'] = { index: query.page.index, size: query.page.size };
  return out as unknown as SerializedDataQuery;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Migrates a serialized query from an older schema version to the
 * current one. One switch case per recorded shape-breaking revision;
 * older versions without a case carry a field-subset of the current
 * shape and are forward-filled by stamping the current version (missing
 * fields take defaults during deserialization). Returns `null` when an
 * older form cannot be carried forward.
 */
function migrateSerializedQuery(
  input: Record<string, unknown>,
): Record<string, unknown> | null {
  switch (input['v']) {
    // No shape-breaking revisions recorded yet: every version below the
    // current one (e.g. the pre-1 draft envelope) is a compatible
    // subset, so forward-filling is the whole migration.
    default:
      return { ...input, v: DATA_QUERY_SCHEMA_VERSION };
  }
}

/**
 * Deserializes an unknown value (e.g. parsed from a URL parameter or a
 * stored saved view) back into a {@link DataQuery}.
 *
 * Validates the envelope shape, routes older schema versions through the
 * migration step, and merges {@link createDefaultQuery} defaults for
 * omitted parts. Returns `null` — never throws — for unusable input or a
 * future (unknown, higher) schema version, so a tampered shared URL
 * degrades to the default view instead of breaking the page load.
 */
export function deserializeDataQuery(input: unknown): DataQuery | null {
  if (!isPlainObject(input)) {
    return null;
  }
  const version = input['v'];
  if (!isNonNegativeInteger(version) || version > DATA_QUERY_SCHEMA_VERSION) {
    return null;
  }
  const migrated =
    version < DATA_QUERY_SCHEMA_VERSION ? migrateSerializedQuery(input) : input;
  if (migrated === null) {
    return null;
  }

  const defaults = createDefaultQuery();

  const text = migrated['text'];
  if (text !== undefined && typeof text !== 'string') {
    return null;
  }

  const fields = migrated['fields'];
  if (fields !== undefined && !isPlainObject(fields)) {
    return null;
  }

  let sort: SortState | null = defaults.sort;
  const rawSort = migrated['sort'];
  if (rawSort !== undefined) {
    if (!isPlainObject(rawSort)) {
      return null;
    }
    const key = rawSort['key'];
    const dir = rawSort['dir'];
    if (typeof key !== 'string' || key === '' || (dir !== 'asc' && dir !== 'desc')) {
      return null;
    }
    sort = { key, direction: dir };
  }

  let page = defaults.page;
  const rawPage = migrated['page'];
  if (rawPage !== undefined) {
    if (!isPlainObject(rawPage)) {
      return null;
    }
    const index = rawPage['index'];
    const size = rawPage['size'];
    if (!isNonNegativeInteger(index) || !isNonNegativeInteger(size) || size < 1) {
      return null;
    }
    page = { index, size };
  }

  const filter: FilterState = {
    ...(typeof text === 'string' && text.trim() !== '' ? { text } : {}),
    ...(fields !== undefined && Object.keys(fields).length > 0 ? { fields } : {}),
  };

  return { filter, sort, page };
}

/**
 * Encodes a {@link DataQuery} as a single compact-JSON string suitable
 * for one router query parameter. The router percent-encodes it; the
 * value stays human-debuggable in the address bar.
 */
export function encodeDataQueryParam(query: DataQuery): string {
  return JSON.stringify(serializeDataQuery(query));
}

/**
 * Decodes a router query parameter produced by
 * {@link encodeDataQueryParam} back into a {@link DataQuery}. Returns
 * `null` — never throws — for missing, malformed, or tampered input.
 */
export function decodeDataQueryParam(param: string | null | undefined): DataQuery | null {
  if (typeof param !== 'string' || param === '') {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(param);
  } catch {
    return null;
  }
  return deserializeDataQuery(parsed);
}

/** FNV-1a 32-bit offset basis. */
const FNV_OFFSET_BASIS = 0x811c9dc5;
/** FNV-1a 32-bit prime. */
const FNV_PRIME = 0x01000193;

/**
 * Stable, pure hash of a {@link DataQuery}: FNV-1a 32-bit over the
 * canonical serialized JSON, returned as fixed-width (8 character)
 * lowercase hex. Equal queries always hash identically, making the value
 * suitable for cache keys and as the query identity in telemetry events
 * (which must never carry raw filter text). No crypto dependency; not
 * collision-resistant against adversaries — an identity, not a secret.
 */
export function dataQueryHash(query: DataQuery): string {
  const text = JSON.stringify(serializeDataQuery(query));
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
