import {
  buildExportFilename,
  createExportResult,
  EXPORT_MEDIA_TYPES,
  flattenRows,
  rowsToCsv,
  rowsToJson,
  type ExportColumn,
  type ExportRequest,
} from './export';
import type { SerializedDataQuery } from './query-serialization';
import type { ReportFormattingPolicy } from './temporal';

interface InvoiceRow {
  readonly id: string;
  readonly customer: string;
  readonly amount: number;
  readonly issuedAt: string;
  readonly note: string | null;
}

const COLUMNS: readonly ExportColumn[] = [
  { key: 'id', header: 'Invoice' },
  { key: 'customer', header: 'Customer' },
  { key: 'amount', header: 'Amount', type: 'currency' },
  { key: 'issuedAt', header: 'Issued', type: 'date' },
  { key: 'note', header: 'Note' },
];

const ROWS: readonly InvoiceRow[] = [
  {
    id: 'INV-001',
    customer: 'Acme Corp',
    amount: 1234.5,
    issuedAt: '2026-06-01T00:00:00.000Z',
    note: null,
  },
  {
    id: 'INV-002',
    customer: 'Nimbus, Ltd.',
    amount: 88,
    issuedAt: '2026-06-02T00:00:00.000Z',
    note: 'He said "rush it"',
  },
];

const POLICY: ReportFormattingPolicy = {
  locale: 'en-US',
  timeZone: 'UTC',
  currencyCode: 'USD',
};

const QUERY: SerializedDataQuery = { v: 1, page: { index: 0, size: 25 } };

function makeRequest(overrides: Partial<ExportRequest> = {}): ExportRequest {
  return {
    reportId: 'invoices',
    format: 'csv',
    scope: 'page',
    fileBaseName: 'invoices',
    query: QUERY,
    columns: COLUMNS,
    requestedAt: '2026-06-12T09:30:00.000Z',
    ...overrides,
  };
}

describe('flattenRows', () => {
  it('projects rows through the column list in order', () => {
    const records = flattenRows(ROWS, COLUMNS);
    expect(records).toHaveLength(2);
    expect(Object.keys(records[0])).toEqual([
      'id',
      'customer',
      'amount',
      'issuedAt',
      'note',
    ]);
    expect(records[0]['id']).toBe('INV-001');
  });

  it('renders null/undefined as the empty string', () => {
    const records = flattenRows(ROWS, COLUMNS);
    expect(records[0]['note']).toBe('');
    const missing = flattenRows([{ id: 'x' }], COLUMNS);
    expect(missing[0]['customer']).toBe('');
  });

  it('plainly stringifies without a policy (dates as UTC ISO instants)', () => {
    const records = flattenRows(
      [{ when: new Date('2026-06-01T12:00:00Z'), n: 1234.5 }],
      [
        { key: 'when', header: 'When', type: 'date' },
        { key: 'n', header: 'N', type: 'number' },
      ],
    );
    expect(records[0]['when']).toBe('2026-06-01T12:00:00.000Z');
    expect(records[0]['n']).toBe('1234.5');
  });

  it('formats currency, number, and date columns via the policy', () => {
    const records = flattenRows(
      [{ amount: 1234.5, count: 9876.5, issuedAt: '2026-06-01T00:00:00Z' }],
      [
        { key: 'amount', header: 'Amount', type: 'currency' },
        { key: 'count', header: 'Count', type: 'number' },
        { key: 'issuedAt', header: 'Issued', type: 'date' },
      ],
      POLICY,
    );
    expect(records[0]['amount']).toBe('$1,234.50');
    expect(records[0]['count']).toBe('9,876.5');
    expect(records[0]['issuedAt']).toBe('6/1/2026');
  });

  it('formats date boundaries in the policy time zone, not UTC', () => {
    const records = flattenRows(
      [{ issuedAt: '2026-06-01T23:30:00Z' }],
      [{ key: 'issuedAt', header: 'Issued', type: 'date' }],
      { locale: 'en-US', timeZone: 'Pacific/Auckland' },
    );
    // 23:30 UTC on June 1 is already June 2 in Auckland (UTC+12).
    expect(records[0]['issuedAt']).toBe('6/2/2026');
  });

  it('falls back to a plain number when the policy has no currency code', () => {
    const records = flattenRows(
      [{ amount: 1234.5 }],
      [{ key: 'amount', header: 'Amount', type: 'currency' }],
      { locale: 'en-US', timeZone: 'UTC' },
    );
    expect(records[0]['amount']).toBe('1,234.5');
  });

  it('falls back to plain stringification for unformattable values', () => {
    const records = flattenRows(
      [{ amount: 'n/a', issuedAt: 'not-a-date' }],
      [
        { key: 'amount', header: 'Amount', type: 'currency' },
        { key: 'issuedAt', header: 'Issued', type: 'date' },
      ],
      POLICY,
    );
    expect(records[0]['amount']).toBe('n/a');
    expect(records[0]['issuedAt']).toBe('not-a-date');
  });
});

describe('rowsToCsv', () => {
  const cell = (csv: string, line: number, column: number): string => {
    // Naive split is fine here: the cases using this helper avoid embedded
    // delimiters/newlines in the asserted cells.
    return csv.split('\r\n')[line].split(',')[column];
  };

  it('writes a header row from the column headers', () => {
    const csv = rowsToCsv([], COLUMNS);
    expect(csv).toBe('Invoice,Customer,Amount,Issued,Note');
  });

  it('produces a header-only file for zero rows', () => {
    const csv = rowsToCsv([], COLUMNS, POLICY);
    expect(csv.split('\r\n')).toHaveLength(1);
  });

  it('quotes cells containing commas and doubles embedded quotes', () => {
    const csv = rowsToCsv(ROWS, COLUMNS);
    const lines = csv.split('\r\n');
    expect(lines[2]).toContain('"Nimbus, Ltd."');
    expect(lines[2]).toContain('"He said ""rush it"""');
  });

  it('quotes cells containing CR and LF', () => {
    const csv = rowsToCsv(
      [{ note: 'line one\nline two' }, { note: 'carriage\rreturn' }],
      [{ key: 'note', header: 'Note' }],
    );
    expect(csv).toBe(
      'Note\r\n"line one\nline two"\r\n"carriage\rreturn"',
    );
  });

  it('neutralizes formula-leading =, +, -, @ cells with a leading quote', () => {
    const rows = [
      { a: '=SUM(A1:A9)', b: '+1', c: '-secret', d: '@handle' },
    ];
    const columns: ExportColumn[] = [
      { key: 'a', header: 'A' },
      { key: 'b', header: 'B' },
      { key: 'c', header: 'C' },
      { key: 'd', header: 'D' },
    ];
    const csv = rowsToCsv(rows, columns);
    expect(cell(csv, 1, 0)).toBe("'=SUM(A1:A9)");
    expect(cell(csv, 1, 1)).toBe("'+1");
    expect(cell(csv, 1, 2)).toBe("'-secret");
    expect(cell(csv, 1, 3)).toBe("'@handle");
  });

  it('leaves ordinary cells unquoted and un-neutralized', () => {
    const csv = rowsToCsv(
      [{ name: 'plain text 123' }],
      [{ key: 'name', header: 'Name' }],
    );
    expect(csv).toBe('Name\r\nplain text 123');
  });

  it('applies policy formatting before quoting (grouped digits get quoted)', () => {
    const csv = rowsToCsv(
      [{ amount: 1234.5 }],
      [{ key: 'amount', header: 'Amount', type: 'currency' }],
      POLICY,
    );
    expect(csv.split('\r\n')[1]).toBe('"$1,234.50"');
  });

  it('quotes headers containing delimiters', () => {
    const csv = rowsToCsv([], [{ key: 'x', header: 'Amount, USD' }]);
    expect(csv).toBe('"Amount, USD"');
  });
});

describe('rowsToJson', () => {
  it('carries the same projected rows as the CSV baseline', () => {
    const parsed = JSON.parse(rowsToJson(ROWS, COLUMNS, POLICY)) as Record<
      string,
      string
    >[];
    expect(parsed).toEqual(flattenRows(ROWS, COLUMNS, POLICY));
    expect(parsed[0]['amount']).toBe('$1,234.50');
  });

  it('produces a valid empty array for zero rows', () => {
    expect(JSON.parse(rowsToJson([], COLUMNS))).toEqual([]);
  });
});

describe('buildExportFilename', () => {
  it('builds <base>_<date>.<format> from the timestamp calendar date', () => {
    expect(buildExportFilename('invoices', 'csv', '2026-06-12T09:30:00.000Z')).toBe(
      'invoices_2026-06-12.csv',
    );
    expect(buildExportFilename('invoices', 'json', '2026-06-12T09:30:00.000Z')).toBe(
      'invoices_2026-06-12.json',
    );
  });

  it('is deterministic for identical inputs', () => {
    const a = buildExportFilename('Overdue Invoices', 'csv', '2026-06-12T00:00:00Z');
    const b = buildExportFilename('Overdue Invoices', 'csv', '2026-06-12T00:00:00Z');
    expect(a).toBe(b);
  });

  it('lowercases and sanitizes the base name to [a-z0-9-_]', () => {
    expect(
      buildExportFilename('Overdue Invoices (Q2)!', 'csv', '2026-06-12T00:00:00Z'),
    ).toBe('overdue-invoices-q2_2026-06-12.csv');
    expect(
      buildExportFilename('high_value', 'json', '2026-06-12T00:00:00Z'),
    ).toBe('high_value_2026-06-12.json');
  });

  it('falls back to a safe base when sanitization leaves nothing', () => {
    expect(buildExportFilename('???', 'csv', '2026-06-12T00:00:00Z')).toBe(
      'export_2026-06-12.csv',
    );
  });
});

describe('createExportResult', () => {
  it('produces a success result with content, filename, media type, and row count', () => {
    const result = createExportResult(makeRequest(), ROWS, POLICY);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.filename).toBe('invoices_2026-06-12.csv');
    expect(result.mediaType).toBe('text/csv');
    expect(result.rowCount).toBe(2);
    expect(result.content).toBe(rowsToCsv(ROWS, COLUMNS, POLICY));
    expect(result.request).toEqual(makeRequest());
  });

  it('renders JSON content for json requests', () => {
    const request = makeRequest({ format: 'json' });
    const result = createExportResult(request, ROWS, POLICY);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.filename).toBe('invoices_2026-06-12.json');
    expect(result.mediaType).toBe(EXPORT_MEDIA_TYPES.json);
    expect(JSON.parse(result.content)).toHaveLength(2);
  });

  it('produces a valid zero-row export with rowCount 0', () => {
    const result = createExportResult(makeRequest(), [], POLICY);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.rowCount).toBe(0);
    expect(result.content).toBe('Invoice,Customer,Amount,Issued,Note');
  });

  it('returns an error result instead of throwing when row access fails', () => {
    const hostileRow = new Proxy(
      {},
      {
        get(): never {
          throw new Error('row access exploded');
        },
      },
    );
    const result = createExportResult(makeRequest(), [hostileRow]);
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') {
      return;
    }
    expect(result.error.kind).toBe('internal');
    expect(result.error.message).toBe('row access exploded');
    expect(result.error.retryable).toBe(false);
    expect(result.request.reportId).toBe('invoices');
  });
});
