import { firstValueFrom } from 'rxjs';

import { InMemoryTableDataSource } from './memory-datasource';
import { createDefaultQuery, DataPage, DataQuery } from './query';

interface OrderRow {
  id: number;
  customerName: string;
  status: 'open' | 'shipped' | 'cancelled';
  amount: number;
  issuedAt: Date | null;
  notes?: string;
}

const ORDERS: OrderRow[] = [
  {
    id: 1,
    customerName: 'Acme Corp 12',
    status: 'open',
    amount: 250.5,
    issuedAt: new Date('2026-01-15T00:00:00Z'),
  },
  {
    id: 2,
    customerName: 'Globex 7',
    status: 'shipped',
    amount: 99,
    issuedAt: new Date('2025-12-01T00:00:00Z'),
    notes: 'expedite',
  },
  {
    id: 3,
    customerName: 'Customer 0042',
    status: 'open',
    amount: 1200,
    issuedAt: new Date('2026-03-02T00:00:00Z'),
  },
  {
    id: 4,
    customerName: 'acme corp 12 subsidiary',
    status: 'cancelled',
    amount: 99,
    issuedAt: null,
  },
  {
    id: 5,
    customerName: 'Initech 3',
    status: 'shipped',
    amount: -10,
    issuedAt: new Date('2026-03-02T00:00:00Z'),
    notes: 'refund',
  },
];

function query(overrides: Partial<DataQuery> = {}): DataQuery {
  return { ...createDefaultQuery(), ...overrides };
}

function fetchPage(
  source: InMemoryTableDataSource<OrderRow>,
  q: DataQuery
): Promise<DataPage<OrderRow>> {
  return firstValueFrom(source.fetch(q));
}

describe('InMemoryTableDataSource', () => {
  let source: InMemoryTableDataSource<OrderRow>;

  beforeEach(() => {
    source = new InMemoryTableDataSource(ORDERS);
  });

  describe('no filter', () => {
    it('returns all rows with the correct total count for an empty filter', async () => {
      const page = await fetchPage(source, query());
      expect(page.rows).toEqual(ORDERS);
      expect(page.totalCount).toBe(5);
      expect(page.pageIndex).toBe(0);
      expect(page.pageSize).toBe(createDefaultQuery().page.size);
    });

    it('treats whitespace-only text as no filter', async () => {
      const page = await fetchPage(source, query({ filter: { text: '   ' } }));
      expect(page.totalCount).toBe(5);
    });

    it('does not mutate or share the original rows array', async () => {
      const rows = [...ORDERS];
      const local = new InMemoryTableDataSource(rows);
      rows.push({ id: 99, customerName: 'Late Add 1', status: 'open', amount: 1, issuedAt: null });
      const page = await fetchPage(local, query());
      expect(page.totalCount).toBe(5);
    });
  });

  describe('text filter', () => {
    it('matches case-insensitively across all string fields by default', async () => {
      const page = await fetchPage(source, query({ filter: { text: 'ACME' } }));
      expect(page.rows.map((row) => row.id)).toEqual([1, 4]);
      expect(page.totalCount).toBe(2);
    });

    it('searches optional string fields when present', async () => {
      const page = await fetchPage(source, query({ filter: { text: 'refund' } }));
      expect(page.rows.map((row) => row.id)).toEqual([5]);
    });

    it('ignores non-string fields by default', async () => {
      // '99' appears only as a number (amount) — no string field contains it.
      const page = await fetchPage(source, query({ filter: { text: '99' } }));
      expect(page.totalCount).toBe(0);
    });

    it('restricts the search to textSearchKeys and stringifies their values', async () => {
      const keyed = new InMemoryTableDataSource(ORDERS, { textSearchKeys: ['id', 'status'] });
      const byId = await fetchPage(keyed, query({ filter: { text: '3' } }));
      expect(byId.rows.map((row) => row.id)).toEqual([3]);
      const byStatus = await fetchPage(keyed, query({ filter: { text: 'SHIP' } }));
      expect(byStatus.rows.map((row) => row.id)).toEqual([2, 5]);
      // customerName is not a search key, so it must not match.
      const byName = await fetchPage(keyed, query({ filter: { text: 'acme' } }));
      expect(byName.totalCount).toBe(0);
    });

    it('returns an empty page when nothing matches', async () => {
      const page = await fetchPage(source, query({ filter: { text: 'no-such-customer' } }));
      expect(page.rows).toEqual([]);
      expect(page.totalCount).toBe(0);
    });
  });

  describe('field filters', () => {
    it('applies exact-match field filters', async () => {
      const page = await fetchPage(source, query({ filter: { fields: { status: 'open' } } }));
      expect(page.rows.map((row) => row.id)).toEqual([1, 3]);
    });

    it('combines multiple field filters with AND semantics', async () => {
      const page = await fetchPage(
        source,
        query({ filter: { fields: { status: 'shipped', amount: 99 } } })
      );
      expect(page.rows.map((row) => row.id)).toEqual([2]);
    });

    it('matches Date field values by timestamp, not identity', async () => {
      const page = await fetchPage(
        source,
        query({ filter: { fields: { issuedAt: new Date('2026-03-02T00:00:00Z') } } })
      );
      expect(page.rows.map((row) => row.id)).toEqual([3, 5]);
    });

    it('uses strict equality (no type coercion)', async () => {
      const page = await fetchPage(source, query({ filter: { fields: { amount: '99' } } }));
      expect(page.totalCount).toBe(0);
    });

    it('ignores undefined filter values', async () => {
      const page = await fetchPage(source, query({ filter: { fields: { status: undefined } } }));
      expect(page.totalCount).toBe(5);
    });

    it('matches explicit null filter values against null fields', async () => {
      const page = await fetchPage(source, query({ filter: { fields: { issuedAt: null } } }));
      expect(page.rows.map((row) => row.id)).toEqual([4]);
    });

    it('combines text and field filters', async () => {
      const page = await fetchPage(
        source,
        query({ filter: { text: 'acme', fields: { status: 'open' } } })
      );
      expect(page.rows.map((row) => row.id)).toEqual([1]);
    });
  });

  describe('sorting', () => {
    it('sorts strings case-insensitively ascending', async () => {
      const page = await fetchPage(
        source,
        query({ sort: { key: 'customerName', direction: 'asc' } })
      );
      expect(page.rows.map((row) => row.id)).toEqual([1, 4, 3, 2, 5]);
    });

    it('sorts numbers descending, including negatives', async () => {
      const page = await fetchPage(source, query({ sort: { key: 'amount', direction: 'desc' } }));
      expect(page.rows.map((row) => row.amount)).toEqual([1200, 250.5, 99, 99, -10]);
    });

    it('sorts dates chronologically and places null values last in both directions', async () => {
      const asc = await fetchPage(source, query({ sort: { key: 'issuedAt', direction: 'asc' } }));
      expect(asc.rows.map((row) => row.id)).toEqual([2, 1, 3, 5, 4]);
      const desc = await fetchPage(source, query({ sort: { key: 'issuedAt', direction: 'desc' } }));
      expect(desc.rows.map((row) => row.id)).toEqual([3, 5, 1, 2, 4]);
    });

    it('places undefined values last when sorting an optional field', async () => {
      const page = await fetchPage(source, query({ sort: { key: 'notes', direction: 'asc' } }));
      expect(page.rows.map((row) => row.id)).toEqual([2, 5, 1, 3, 4]);
    });

    it('does not reorder rows when sort is null', async () => {
      const page = await fetchPage(source, query({ sort: null }));
      expect(page.rows.map((row) => row.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it('leaves the source order intact after sorting (no in-place mutation)', async () => {
      await fetchPage(source, query({ sort: { key: 'amount', direction: 'desc' } }));
      const page = await fetchPage(source, query());
      expect(page.rows.map((row) => row.id)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('pagination', () => {
    it('slices rows into pages and reports the unpaginated total', async () => {
      const first = await fetchPage(source, query({ page: { index: 0, size: 2 } }));
      expect(first.rows.map((row) => row.id)).toEqual([1, 2]);
      expect(first.totalCount).toBe(5);
      expect(first.pageIndex).toBe(0);
      expect(first.pageSize).toBe(2);
      const second = await fetchPage(source, query({ page: { index: 1, size: 2 } }));
      expect(second.rows.map((row) => row.id)).toEqual([3, 4]);
    });

    it('returns a short final page', async () => {
      const page = await fetchPage(source, query({ page: { index: 2, size: 2 } }));
      expect(page.rows.map((row) => row.id)).toEqual([5]);
      expect(page.totalCount).toBe(5);
    });

    it('returns empty rows for an out-of-range page but keeps totalCount', async () => {
      const page = await fetchPage(source, query({ page: { index: 10, size: 2 } }));
      expect(page.rows).toEqual([]);
      expect(page.totalCount).toBe(5);
      expect(page.pageIndex).toBe(10);
    });

    it('clamps negative page index to 0 and page size to at least 1', async () => {
      const page = await fetchPage(source, query({ page: { index: -2, size: 0 } }));
      expect(page.pageIndex).toBe(0);
      expect(page.pageSize).toBe(1);
      expect(page.rows.map((row) => row.id)).toEqual([1]);
    });

    it('paginates after filtering and sorting', async () => {
      const page = await fetchPage(
        source,
        query({
          filter: { fields: { status: 'open' } },
          sort: { key: 'amount', direction: 'desc' },
          page: { index: 1, size: 1 },
        })
      );
      expect(page.rows.map((row) => row.id)).toEqual([1]);
      expect(page.totalCount).toBe(2);
    });
  });

  describe('latency and dataset edges', () => {
    it('emits synchronously by default (latency 0)', () => {
      let emitted = false;
      source.fetch(query()).subscribe(() => (emitted = true));
      expect(emitted).toBe(true);
    });

    it('delays emission when a latency option is supplied', async () => {
      const delayed = new InMemoryTableDataSource(ORDERS, { latencyMs: 20 });
      const before = Date.now();
      const page = await fetchPage(delayed, query());
      expect(Date.now() - before).toBeGreaterThanOrEqual(15);
      expect(page.totalCount).toBe(5);
    });

    it('handles an empty dataset', async () => {
      const empty = new InMemoryTableDataSource<OrderRow>([]);
      const page = await fetchPage(
        empty,
        query({ filter: { text: 'acme' }, sort: { key: 'amount', direction: 'asc' } })
      );
      expect(page.rows).toEqual([]);
      expect(page.totalCount).toBe(0);
    });
  });
});
