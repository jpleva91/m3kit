import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { Subject, throwError } from 'rxjs';

import {
  InMemoryTableDataSource,
  type DataPage,
  type DataQuery,
  type TableDataSource,
} from '@m3kit/core';

import { TEXT_FILTER_DEBOUNCE_MS, withDataQuery } from './with-data-query';

interface Invoice {
  id: number;
  customer: string;
  status: string;
  amount: number;
}

const INVOICES: readonly Invoice[] = [
  { id: 1, customer: 'Acme', status: 'paid', amount: 300 },
  { id: 2, customer: 'Globex', status: 'sent', amount: 100 },
  { id: 3, customer: 'Initech', status: 'paid', amount: 200 },
  { id: 4, customer: 'Umbrella', status: 'overdue', amount: 400 },
  { id: 5, customer: 'Acme Labs', status: 'sent', amount: 500 },
];

const InvoiceStore = signalStore(
  { providedIn: 'root' },
  withDataQuery<Invoice>({ initialPageSize: 2 })
);

/** Records every query it receives; resolves through an in-memory source. */
class RecordingDataSource implements TableDataSource<Invoice> {
  readonly queries: DataQuery[] = [];
  private readonly inner: InMemoryTableDataSource<Invoice>;

  constructor(latencyMs = 0) {
    this.inner = new InMemoryTableDataSource(INVOICES, {
      textSearchKeys: ['customer'],
      latencyMs,
    });
  }

  fetch(query: DataQuery) {
    this.queries.push(query);
    return this.inner.fetch(query);
  }
}

function createStore(): InstanceType<typeof InvoiceStore> {
  TestBed.configureTestingModule({});
  return TestBed.inject(InvoiceStore);
}

describe('withDataQuery', () => {
  it('starts with an empty page and a neutral query', () => {
    const store = createStore();
    expect(store.rows()).toEqual([]);
    expect(store.totalCount()).toBe(0);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.textFilter()).toBe('');
    expect(store.sort()).toBeNull();
    expect(store.page()).toEqual({ index: 0, size: 2 });
    expect(store.isEmpty()).toBe(true);
  });

  it('does not fetch before a data source is connected', () => {
    const store = createStore();
    store.setPage({ index: 1, size: 2 });
    expect(store.loading()).toBe(false);
    expect(store.rows()).toEqual([]);
    // The query mutation itself still lands.
    expect(store.page()).toEqual({ index: 1, size: 2 });
  });

  it('connect() runs the current query and populates rows/totalCount', () => {
    const store = createStore();
    const dataSource = new RecordingDataSource();

    store.connect(dataSource);

    expect(dataSource.queries).toHaveLength(1);
    expect(store.rows().map((row) => row.id)).toEqual([1, 2]);
    expect(store.totalCount()).toBe(5);
    expect(store.pageCount()).toBe(3);
    expect(store.loading()).toBe(false);
    expect(store.isEmpty()).toBe(false);
  });

  it('tracks loading across an async fetch', fakeAsync(() => {
    const store = createStore();
    store.connect(new RecordingDataSource(50));

    expect(store.loading()).toBe(true);
    expect(store.rows()).toEqual([]);

    tick(50);
    expect(store.loading()).toBe(false);
    expect(store.rows()).toHaveLength(2);
  }));

  it('cancels stale in-flight fetches via switchMap (latest query wins)', fakeAsync(() => {
    const store = createStore();
    const dataSource = new RecordingDataSource(50);
    store.connect(dataSource);
    tick(50);

    store.setPage({ index: 1, size: 2 });
    tick(10);
    store.setPage({ index: 2, size: 2 });
    tick(50);

    expect(dataSource.queries).toHaveLength(3);
    expect(store.rows().map((row) => row.id)).toEqual([5]);
    expect(store.page().index).toBe(2);
    expect(store.loading()).toBe(false);
  }));

  describe('setTextFilter', () => {
    it('debounces, applies the trimmed text, and resets to the first page', fakeAsync(() => {
      const store = createStore();
      const dataSource = new RecordingDataSource();
      store.connect(dataSource);
      store.setPage({ index: 1, size: 2 });
      expect(dataSource.queries).toHaveLength(2);

      store.setTextFilter('a');
      store.setTextFilter('ac');
      store.setTextFilter('acme');

      tick(TEXT_FILTER_DEBOUNCE_MS - 1);
      // Still debouncing: no new fetch, no state change.
      expect(dataSource.queries).toHaveLength(2);
      expect(store.textFilter()).toBe('');

      tick(1);
      expect(dataSource.queries).toHaveLength(3);
      expect(store.textFilter()).toBe('acme');
      expect(store.page().index).toBe(0);
      expect(store.rows().map((row) => row.customer)).toEqual([
        'Acme',
        'Acme Labs',
      ]);
      expect(store.totalCount()).toBe(2);
    }));

    it('treats whitespace-only text as "no filter" and dedupes repeats', fakeAsync(() => {
      const store = createStore();
      const dataSource = new RecordingDataSource();
      store.connect(dataSource);

      store.setTextFilter('   ');
      tick(TEXT_FILTER_DEBOUNCE_MS);
      expect(store.query().filter.text).toBeUndefined();
      expect(dataSource.queries).toHaveLength(2);

      store.setTextFilter('   ');
      tick(TEXT_FILTER_DEBOUNCE_MS);
      // distinctUntilChanged: identical input does not refetch.
      expect(dataSource.queries).toHaveLength(2);
    }));
  });

  it('setFieldFilters applies exact-match filters and resets the page', () => {
    const store = createStore();
    const dataSource = new RecordingDataSource();
    store.connect(dataSource);
    store.setPage({ index: 1, size: 2 });

    store.setFieldFilters({ status: 'sent' });

    expect(store.fieldFilters()).toEqual({ status: 'sent' });
    expect(store.page().index).toBe(0);
    expect(store.rows().map((row) => row.id)).toEqual([2, 5]);
    expect(store.totalCount()).toBe(2);
  });

  it('setSort orders results and resets the page', () => {
    const store = createStore();
    store.connect(new RecordingDataSource());
    store.setPage({ index: 1, size: 2 });

    store.setSort({ key: 'amount', direction: 'desc' });

    expect(store.sort()).toEqual({ key: 'amount', direction: 'desc' });
    expect(store.page().index).toBe(0);
    expect(store.rows().map((row) => row.amount)).toEqual([500, 400]);
  });

  it('setPage fetches the requested page', () => {
    const store = createStore();
    store.connect(new RecordingDataSource());

    store.setPage({ index: 2, size: 2 });

    expect(store.rows().map((row) => row.id)).toEqual([5]);
    expect(store.totalCount()).toBe(5);
  });

  it('refresh() re-runs the current query', () => {
    const store = createStore();
    const dataSource = new RecordingDataSource();
    store.connect(dataSource);

    store.refresh();

    expect(dataSource.queries).toHaveLength(2);
    expect(dataSource.queries[1]).toEqual(dataSource.queries[0]);
  });

  it('reconnecting replaces the data source and refetches', () => {
    const store = createStore();
    store.connect(new RecordingDataSource());
    const replacement = new RecordingDataSource();

    store.connect(replacement);

    expect(replacement.queries).toHaveLength(1);
    expect(store.rows()).toHaveLength(2);
  });

  describe('errors', () => {
    it('surfaces fetch errors and clears loading', () => {
      const store = createStore();
      store.connect({
        fetch: () => throwError(() => new Error('boom')),
      });

      expect(store.error()).toBe('boom');
      expect(store.loading()).toBe(false);
      expect(store.rows()).toEqual([]);
    });

    it('keeps the rxMethod subscription alive after an error', () => {
      const store = createStore();
      let failNext = true;
      const healthy = new RecordingDataSource();
      store.connect({
        fetch: (query) => {
          if (failNext) {
            failNext = false;
            return throwError(() => new Error('boom'));
          }
          return healthy.fetch(query);
        },
      });
      expect(store.error()).toBe('boom');

      store.refresh();

      expect(store.error()).toBeNull();
      expect(store.rows()).toHaveLength(2);
    });

    it('clears a stale error when a new fetch starts', () => {
      const store = createStore();
      const gate = new Subject<DataPage<Invoice>>();
      let calls = 0;
      store.connect({
        fetch: () => {
          calls += 1;
          return calls === 1 ? throwError(() => 'nope') : gate.asObservable();
        },
      });
      expect(store.error()).toBe('nope');

      store.refresh();

      expect(store.error()).toBeNull();
      expect(store.loading()).toBe(true);
    });
  });
});
