import {
  DATA_QUERY_SCHEMA_VERSION,
  dataQueryHash,
  decodeDataQueryParam,
  deserializeDataQuery,
  encodeDataQueryParam,
  serializeDataQuery,
} from './query-serialization';
import type { DataQuery } from './query';
import { createDefaultQuery, DEFAULT_PAGE_SIZE } from './query';

const FULL_QUERY: DataQuery = {
  filter: { text: 'acme', fields: { status: 'overdue', region: 'east' } },
  sort: { key: 'dueAt', direction: 'desc' },
  page: { index: 2, size: 10 },
};

describe('serializeDataQuery', () => {
  it('serializes the default query to a minimal envelope', () => {
    const serialized = serializeDataQuery(createDefaultQuery());
    expect(serialized).toEqual({
      v: DATA_QUERY_SCHEMA_VERSION,
      page: { index: 0, size: DEFAULT_PAGE_SIZE },
    });
    expect(Object.keys(serialized)).toEqual(['v', 'page']);
  });

  it('serializes a full query with the explicit property order', () => {
    const serialized = serializeDataQuery(FULL_QUERY);
    expect(serialized).toEqual({
      v: DATA_QUERY_SCHEMA_VERSION,
      text: 'acme',
      fields: { region: 'east', status: 'overdue' },
      sort: { key: 'dueAt', dir: 'desc' },
      page: { index: 2, size: 10 },
    });
    expect(Object.keys(serialized)).toEqual(['v', 'text', 'fields', 'sort', 'page']);
  });

  it('omits blank text, empty fields, and undefined field values', () => {
    const query: DataQuery = {
      filter: { text: '   ', fields: { status: undefined } },
      sort: null,
      page: { index: 0, size: DEFAULT_PAGE_SIZE },
    };
    expect(serializeDataQuery(query)).toEqual({
      v: DATA_QUERY_SCHEMA_VERSION,
      page: { index: 0, size: DEFAULT_PAGE_SIZE },
    });
  });

  it('is deterministic: equal queries stringify identically regardless of field key order', () => {
    const a: DataQuery = {
      ...FULL_QUERY,
      filter: { text: 'acme', fields: { status: 'overdue', region: 'east' } },
    };
    const b: DataQuery = {
      ...FULL_QUERY,
      filter: { text: 'acme', fields: { region: 'east', status: 'overdue' } },
    };
    expect(JSON.stringify(serializeDataQuery(a))).toBe(JSON.stringify(serializeDataQuery(b)));
  });
});

describe('deserializeDataQuery', () => {
  it('round-trips a full query (deserialize ∘ serialize = identity on normalized input)', () => {
    expect(deserializeDataQuery(serializeDataQuery(FULL_QUERY))).toEqual(FULL_QUERY);
  });

  it('round-trips the default query', () => {
    const query = createDefaultQuery();
    expect(deserializeDataQuery(serializeDataQuery(query))).toEqual(query);
  });

  it('round-trips a non-normalized query to its normalized form', () => {
    const query: DataQuery = {
      filter: { text: '  ', fields: {} },
      sort: null,
      page: { index: 1, size: 50 },
    };
    expect(deserializeDataQuery(serializeDataQuery(query))).toEqual({
      filter: {},
      sort: null,
      page: { index: 1, size: 50 },
    });
  });

  it('merges defaults for an envelope without a page', () => {
    expect(deserializeDataQuery({ v: DATA_QUERY_SCHEMA_VERSION, text: 'acme' })).toEqual({
      filter: { text: 'acme' },
      sort: null,
      page: { index: 0, size: DEFAULT_PAGE_SIZE },
    });
  });

  it('migrates a recorded older-version fixture forward', () => {
    // Recorded pre-1 draft envelope: a field-subset of the v1 shape.
    const fixture = { v: 0, text: 'acme', page: { index: 1, size: 10 } };
    expect(deserializeDataQuery(fixture)).toEqual({
      filter: { text: 'acme' },
      sort: null,
      page: { index: 1, size: 10 },
    });
  });

  it('rejects a future (unknown, higher) schema version', () => {
    expect(
      deserializeDataQuery({ v: DATA_QUERY_SCHEMA_VERSION + 1, page: { index: 0, size: 25 } }),
    ).toBeNull();
  });

  it.each([
    ['null', null],
    ['a string', 'garbage'],
    ['a number', 42],
    ['an array', []],
    ['an object without a version', { page: { index: 0, size: 25 } }],
    ['a non-numeric version', { v: 'one', page: { index: 0, size: 25 } }],
    ['a fractional version', { v: 1.5, page: { index: 0, size: 25 } }],
    ['a non-string text', { v: 1, text: 7, page: { index: 0, size: 25 } }],
    ['array fields', { v: 1, fields: ['status'], page: { index: 0, size: 25 } }],
    ['a sort without a key', { v: 1, sort: { dir: 'asc' }, page: { index: 0, size: 25 } }],
    ['an empty sort key', { v: 1, sort: { key: '', dir: 'asc' }, page: { index: 0, size: 25 } }],
    ['a bad sort direction', { v: 1, sort: { key: 'dueAt', dir: 'up' }, page: { index: 0, size: 25 } }],
    ['a negative page index', { v: 1, page: { index: -1, size: 25 } }],
    ['a zero page size', { v: 1, page: { index: 0, size: 0 } }],
    ['a fractional page index', { v: 1, page: { index: 0.5, size: 25 } }],
    ['a non-object page', { v: 1, page: 'first' }],
  ])('returns null for %s instead of throwing', (_label, input) => {
    expect(deserializeDataQuery(input)).toBeNull();
  });
});

describe('encodeDataQueryParam / decodeDataQueryParam', () => {
  it('round-trips a query through a single string parameter', () => {
    expect(decodeDataQueryParam(encodeDataQueryParam(FULL_QUERY))).toEqual(FULL_QUERY);
  });

  it('encodes compact, human-debuggable JSON', () => {
    const param = encodeDataQueryParam(createDefaultQuery());
    expect(param).toBe(`{"v":${DATA_QUERY_SCHEMA_VERSION},"page":{"index":0,"size":${DEFAULT_PAGE_SIZE}}}`);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['non-JSON text', 'not-json{'],
    ['JSON of the wrong shape', '{"hello":"world"}'],
    ['a tampered envelope', '{"v":1,"page":{"index":-3,"size":25}}'],
  ])('returns null for %s instead of throwing', (_label, param) => {
    expect(decodeDataQueryParam(param)).toBeNull();
  });
});

describe('dataQueryHash', () => {
  it('returns fixed-width lowercase hex', () => {
    expect(dataQueryHash(createDefaultQuery())).toMatch(/^[0-9a-f]{8}$/);
    expect(dataQueryHash(FULL_QUERY)).toMatch(/^[0-9a-f]{8}$/);
  });

  it('hashes equal queries identically regardless of field key order', () => {
    const a: DataQuery = {
      ...FULL_QUERY,
      filter: { text: 'acme', fields: { status: 'overdue', region: 'east' } },
    };
    const b: DataQuery = {
      ...FULL_QUERY,
      filter: { text: 'acme', fields: { region: 'east', status: 'overdue' } },
    };
    expect(dataQueryHash(a)).toBe(dataQueryHash(b));
  });

  it('hashes normalized-equal queries identically', () => {
    const blank: DataQuery = {
      filter: { text: '  ', fields: {} },
      sort: null,
      page: { index: 0, size: DEFAULT_PAGE_SIZE },
    };
    expect(dataQueryHash(blank)).toBe(dataQueryHash(createDefaultQuery()));
  });

  it('hashes different queries differently', () => {
    expect(dataQueryHash(FULL_QUERY)).not.toBe(dataQueryHash(createDefaultQuery()));
    const paged: DataQuery = { ...FULL_QUERY, page: { index: 3, size: 10 } };
    expect(dataQueryHash(paged)).not.toBe(dataQueryHash(FULL_QUERY));
  });

  it('is stable across calls (pure)', () => {
    expect(dataQueryHash(FULL_QUERY)).toBe(dataQueryHash(FULL_QUERY));
  });
});
