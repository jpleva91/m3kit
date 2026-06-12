import type { ColumnDef, TableDefinition } from './models';
import type { DataQuery } from './query';
import { deserializeDataQuery, serializeDataQuery } from './query-serialization';
import {
  applySavedView,
  createSavedView,
  parseSavedView,
  SAVED_VIEW_SCHEMA_VERSION,
  type SavedView,
} from './saved-view';

interface InvoiceRow {
  readonly number: string;
  readonly customer: string;
  readonly amount: number;
  readonly status: string;
  readonly dueAt: string;
}

const COLUMNS: readonly ColumnDef<InvoiceRow>[] = [
  { key: 'number', header: 'Invoice #', type: 'text' },
  { key: 'customer', header: 'Customer', type: 'text' },
  { key: 'amount', header: 'Amount', type: 'currency' },
  { key: 'status', header: 'Status', type: 'badge' },
  { key: 'dueAt', header: 'Due', type: 'date' },
];

const INVOICES: TableDefinition<InvoiceRow> = {
  id: 'invoices',
  title: 'Invoices',
  columns: COLUMNS,
  defaultSort: { key: 'dueAt', direction: 'asc' },
};

const NO_DEFAULT_SORT: TableDefinition<InvoiceRow> = {
  id: 'invoices',
  title: 'Invoices',
  columns: COLUMNS,
};

const QUERY: DataQuery = {
  filter: { text: 'acme', fields: { status: 'overdue' } },
  sort: { key: 'amount', direction: 'desc' },
  page: { index: 2, size: 10 },
};

const NOW = new Date('2026-06-12T10:00:00.000Z');

function overdueView(): SavedView {
  return createSavedView(
    {
      reportId: 'invoices',
      viewId: 'overdue',
      name: 'Overdue invoices',
      description: 'Overdue, largest first',
      query: serializeDataQuery(QUERY),
      columns: [
        { key: 'amount', pinned: 'end' },
        { key: 'customer', visible: false },
      ],
    },
    NOW,
  );
}

describe('createSavedView', () => {
  it('stamps the current schema version and both timestamps from now', () => {
    const view = overdueView();
    expect(view.version).toBe(SAVED_VIEW_SCHEMA_VERSION);
    expect(view.createdAt).toBe('2026-06-12T10:00:00.000Z');
    expect(view.updatedAt).toBe('2026-06-12T10:00:00.000Z');
  });

  it('carries the caller fields through unchanged', () => {
    const view = overdueView();
    expect(view.reportId).toBe('invoices');
    expect(view.viewId).toBe('overdue');
    expect(view.name).toBe('Overdue invoices');
    expect(view.description).toBe('Overdue, largest first');
    expect(view.query).toEqual(serializeDataQuery(QUERY));
    expect(view.columns).toEqual([
      { key: 'amount', pinned: 'end' },
      { key: 'customer', visible: false },
    ]);
  });

  it('omits description and columns when not supplied', () => {
    const view = createSavedView(
      { reportId: 'invoices', viewId: 'all', name: 'All', query: serializeDataQuery(QUERY) },
      NOW,
    );
    expect('description' in view).toBe(false);
    expect('columns' in view).toBe(false);
  });
});

describe('parseSavedView', () => {
  it('round-trips a created view through JSON', () => {
    const view = overdueView();
    expect(parseSavedView(JSON.parse(JSON.stringify(view)))).toEqual(view);
  });

  it('accepts a minimal view without description or columns', () => {
    const view = createSavedView(
      { reportId: 'invoices', viewId: 'all', name: 'All', query: serializeDataQuery(QUERY) },
      NOW,
    );
    expect(parseSavedView(JSON.parse(JSON.stringify(view)))).toEqual(view);
  });

  it.each([null, undefined, 42, 'garbage', [], {}])('rejects garbage input %#', (input) => {
    expect(parseSavedView(input)).toBeNull();
  });

  it('rejects a future (higher) schema version, never half-applying it', () => {
    const tampered = { ...overdueView(), version: SAVED_VIEW_SCHEMA_VERSION + 1 };
    expect(parseSavedView(tampered)).toBeNull();
  });

  it('rejects an unknown pre-current version with no migration path', () => {
    const ancient = { ...overdueView(), version: 0 };
    expect(parseSavedView(ancient)).toBeNull();
  });

  it('rejects missing or empty identity fields', () => {
    const view = overdueView();
    expect(parseSavedView({ ...view, reportId: '' })).toBeNull();
    expect(parseSavedView({ ...view, viewId: undefined })).toBeNull();
    expect(parseSavedView({ ...view, name: 42 })).toBeNull();
  });

  it('rejects unparseable timestamps', () => {
    const view = overdueView();
    expect(parseSavedView({ ...view, createdAt: 'not-a-date' })).toBeNull();
    expect(parseSavedView({ ...view, updatedAt: 42 })).toBeNull();
  });

  it('rejects a structurally invalid columns array', () => {
    const view = overdueView();
    expect(parseSavedView({ ...view, columns: [{ key: 'amount', pinned: 'middle' }] })).toBeNull();
    expect(parseSavedView({ ...view, columns: [{ visible: false }] })).toBeNull();
    expect(parseSavedView({ ...view, columns: 'amount' })).toBeNull();
  });

  it('rejects a view whose embedded query is unusable', () => {
    const view = overdueView();
    expect(parseSavedView({ ...view, query: 'garbage' })).toBeNull();
    expect(parseSavedView({ ...view, query: undefined })).toBeNull();
  });

  it('rejects a view whose embedded query is from a future schema version', () => {
    const view = overdueView();
    const futureQuery = { ...serializeDataQuery(QUERY), v: 999 };
    expect(parseSavedView({ ...view, query: futureQuery })).toBeNull();
  });
});

describe('applySavedView', () => {
  it('returns the deserialized query and the column state for a matching report', () => {
    const applied = applySavedView(overdueView(), INVOICES);
    expect(applied).not.toBeNull();
    expect(applied?.query).toEqual(deserializeDataQuery(serializeDataQuery(QUERY)));
    expect(applied?.columns).toEqual([
      { key: 'amount', pinned: 'end' },
      { key: 'customer', visible: false },
    ]);
  });

  it('returns null on a reportId mismatch', () => {
    const foreign: TableDefinition<InvoiceRow> = { ...INVOICES, id: 'customers' };
    expect(applySavedView(overdueView(), foreign)).toBeNull();
  });

  it('falls back to the definition default sort when the sort key no longer exists', () => {
    const view = createSavedView(
      {
        reportId: 'invoices',
        viewId: 'legacy',
        name: 'Legacy sort',
        query: serializeDataQuery({ ...QUERY, sort: { key: 'removedColumn', direction: 'desc' } }),
      },
      NOW,
    );
    expect(applySavedView(view, INVOICES)?.query.sort).toEqual({ key: 'dueAt', direction: 'asc' });
  });

  it('falls back to null sort when the definition has no default sort', () => {
    const view = createSavedView(
      {
        reportId: 'invoices',
        viewId: 'legacy',
        name: 'Legacy sort',
        query: serializeDataQuery({ ...QUERY, sort: { key: 'removedColumn', direction: 'desc' } }),
      },
      NOW,
    );
    expect(applySavedView(view, NO_DEFAULT_SORT)?.query.sort).toBeNull();
  });

  it('keeps a sort whose key exists in the definition', () => {
    expect(applySavedView(overdueView(), INVOICES)?.query.sort).toEqual({
      key: 'amount',
      direction: 'desc',
    });
  });

  it('drops column entries referencing removed columns and applies the rest', () => {
    const view = createSavedView(
      {
        reportId: 'invoices',
        viewId: 'drifted',
        name: 'Drifted columns',
        query: serializeDataQuery(QUERY),
        columns: [
          { key: 'removedColumn', pinned: 'start' },
          { key: 'status', visible: false },
          { key: 'amount', width: '160px' },
        ],
      },
      NOW,
    );
    expect(applySavedView(view, INVOICES)?.columns).toEqual([
      { key: 'status', visible: false },
      { key: 'amount', width: '160px' },
    ]);
  });

  it('omits columns from the result when the view carries none', () => {
    const view = createSavedView(
      { reportId: 'invoices', viewId: 'all', name: 'All', query: serializeDataQuery(QUERY) },
      NOW,
    );
    const applied = applySavedView(view, INVOICES);
    expect(applied).not.toBeNull();
    expect(applied && 'columns' in applied).toBe(false);
  });

  it('returns null when the embedded query cannot be deserialized', () => {
    const view = {
      ...overdueView(),
      query: { ...serializeDataQuery(QUERY), v: 999 },
    };
    expect(applySavedView(view, INVOICES)).toBeNull();
  });
});
