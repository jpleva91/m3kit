import type { ColumnDef } from './models';
import { resolveColumns, type ColumnViewState } from './column-state';

interface InvoiceRow {
  readonly number: string;
  readonly customer: string;
  readonly amount: number;
  readonly status: string;
}

const NUMBER: ColumnDef<InvoiceRow> = { key: 'number', header: 'Invoice #', type: 'text' };
const CUSTOMER: ColumnDef<InvoiceRow> = { key: 'customer', header: 'Customer', type: 'text' };
const AMOUNT: ColumnDef<InvoiceRow> = {
  key: 'amount',
  header: 'Amount',
  type: 'currency',
  width: '120px',
};
const STATUS: ColumnDef<InvoiceRow> = { key: 'status', header: 'Status', type: 'badge' };

const COLUMNS: readonly ColumnDef<InvoiceRow>[] = [NUMBER, CUSTOMER, AMOUNT, STATUS];

function keys(resolved: readonly { def: ColumnDef<InvoiceRow> }[]): string[] {
  return resolved.map((column) => column.def.key);
}

describe('resolveColumns', () => {
  it('renders all definition columns in definition order without state', () => {
    const resolved = resolveColumns(COLUMNS);
    expect(keys(resolved)).toEqual(['number', 'customer', 'amount', 'status']);
    expect(resolved.every((column) => column.pinned === undefined)).toBe(true);
  });

  it('uses state array order as display order', () => {
    const state: ColumnViewState[] = [{ key: 'status' }, { key: 'amount' }, { key: 'number' }, { key: 'customer' }];
    expect(keys(resolveColumns(COLUMNS, state))).toEqual(['status', 'amount', 'number', 'customer']);
  });

  it('removes columns with visible: false', () => {
    const state: ColumnViewState[] = [
      { key: 'number' },
      { key: 'customer', visible: false },
      { key: 'amount' },
      { key: 'status' },
    ];
    expect(keys(resolveColumns(COLUMNS, state))).toEqual(['number', 'amount', 'status']);
  });

  it('drops entries whose key matches no definition column', () => {
    const state: ColumnViewState[] = [{ key: 'removedColumn' }, { key: 'number' }];
    expect(keys(resolveColumns(COLUMNS, state))).toEqual(['number', 'customer', 'amount', 'status']);
  });

  it('takes the first entry for duplicate keys and drops the rest', () => {
    const state: ColumnViewState[] = [
      { key: 'amount', pinned: 'start', width: '90px' },
      { key: 'amount', pinned: 'end', visible: false, width: '300px' },
      { key: 'number' },
    ];
    const resolved = resolveColumns(COLUMNS, state);
    expect(keys(resolved)).toEqual(['amount', 'number', 'customer', 'status']);
    expect(resolved[0]).toEqual({ def: AMOUNT, pinned: 'start', width: '90px' });
  });

  it('drops a duplicate even when the first entry hid the column', () => {
    const state: ColumnViewState[] = [
      { key: 'amount', visible: false },
      { key: 'amount' },
    ];
    expect(keys(resolveColumns(COLUMNS, state))).toEqual(['number', 'customer', 'status']);
  });

  it('appends unlisted definition columns visible, in definition order', () => {
    const state: ColumnViewState[] = [{ key: 'status' }];
    expect(keys(resolveColumns(COLUMNS, state))).toEqual(['status', 'number', 'customer', 'amount']);
  });

  it('resolves an empty state array to all columns in definition order', () => {
    expect(keys(resolveColumns(COLUMNS, []))).toEqual(['number', 'customer', 'amount', 'status']);
  });

  it('resolves an all-hidden state to an empty column list', () => {
    const state: ColumnViewState[] = COLUMNS.map((def) => ({ key: def.key, visible: false }));
    expect(resolveColumns(COLUMNS, state)).toEqual([]);
  });

  it('carries pinned edges through to the resolution', () => {
    const state: ColumnViewState[] = [
      { key: 'number', pinned: 'start' },
      { key: 'status', pinned: 'end' },
    ];
    const resolved = resolveColumns(COLUMNS, state);
    expect(resolved.find((column) => column.def.key === 'number')?.pinned).toBe('start');
    expect(resolved.find((column) => column.def.key === 'status')?.pinned).toBe('end');
    expect(resolved.find((column) => column.def.key === 'customer')?.pinned).toBeUndefined();
  });

  it('lets a state width override the definition width', () => {
    const state: ColumnViewState[] = [{ key: 'amount', width: '200px' }];
    const resolved = resolveColumns(COLUMNS, state);
    expect(resolved.find((column) => column.def.key === 'amount')?.width).toBe('200px');
  });

  it('falls back to the definition width when the entry sets none', () => {
    const state: ColumnViewState[] = [{ key: 'amount' }, { key: 'customer' }];
    const resolved = resolveColumns(COLUMNS, state);
    expect(resolved.find((column) => column.def.key === 'amount')?.width).toBe('120px');
    expect(resolved.find((column) => column.def.key === 'customer')?.width).toBeUndefined();
  });

  it('uses definition widths for unlisted appended columns', () => {
    const resolved = resolveColumns(COLUMNS, [{ key: 'status' }]);
    expect(resolved.find((column) => column.def.key === 'amount')?.width).toBe('120px');
  });
});
