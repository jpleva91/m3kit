import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { Subject, throwError } from 'rxjs';

import {
  dataQueryHash,
  InMemoryTableDataSource,
  type DataPage,
  type DataQuery,
  type ReportTelemetryEvent,
  type TableDataSource,
} from '@m3kit/core';

import { REPORT_TELEMETRY_REPORTER } from './telemetry-token';
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
  withDataQuery<Invoice>({ initialPageSize: 2, reportId: 'invoices' })
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

function createStoreWithTelemetry(events: ReportTelemetryEvent[]): InstanceType<typeof InvoiceStore> {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: REPORT_TELEMETRY_REPORTER,
        useValue: { report: (event: ReportTelemetryEvent) => events.push(event) },
      },
    ],
  });
  return TestBed.inject(InvoiceStore);
}

describe('withDataQuery', () => {
  it('starts with an empty page and a neutral query', () => {
    const store = createStore();
    expect(store.rows()).toEqual([]);
    expect(store.totalCount()).toBe(0);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.errorMessage()).toBeNull();
    expect(store.hasFetched()).toBe(false);
    expect(store.stale()).toBe(false);
    expect(store.loadState()).toEqual({ kind: 'idle' });
    expect(store.textFilter()).toBe('');
    expect(store.sort()).toBeNull();
    expect(store.page()).toEqual({ index: 0, size: 2 });
    expect(store.isEmpty()).toBe(false);
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
    expect(store.hasFetched()).toBe(true);
    expect(store.loadState()).toEqual({
      kind: 'success',
      data: { rows: store.rows(), totalCount: 5, pageIndex: 0, pageSize: 2 },
      stale: false,
    });
  });

  it('tracks loading across an async fetch', fakeAsync(() => {
    const store = createStore();
    store.connect(new RecordingDataSource(50));

    expect(store.loading()).toBe(true);
    expect(store.rows()).toEqual([]);
    expect(store.loadState()).toEqual({ kind: 'loading' });

    tick(50);
    expect(store.loading()).toBe(false);
    expect(store.rows()).toHaveLength(2);
  }));

  it('reports refreshing while a refetch is in flight with retained rows', fakeAsync(() => {
    const store = createStore();
    const dataSource = new RecordingDataSource(50);
    store.connect(dataSource);
    tick(50);

    store.refresh();

    expect(store.loading()).toBe(true);
    expect(store.loadState()).toEqual({
      kind: 'refreshing',
      data: { rows: store.rows(), totalCount: 5, pageIndex: 0, pageSize: 2 },
    });
    tick(50);
    expect(store.loadState().kind).toBe('success');
  }));

  it('marks settled results stale and clears the stale flag on the next success', () => {
    const store = createStore();
    store.connect(new RecordingDataSource());

    store.markStale();

    expect(store.stale()).toBe(true);
    expect(store.loadState()).toEqual({
      kind: 'success',
      data: { rows: store.rows(), totalCount: 5, pageIndex: 0, pageSize: 2 },
      stale: true,
    });

    store.refresh();

    expect(store.stale()).toBe(false);
    expect(store.loadState().kind).toBe('success');
  });

  it('derives empty load state after a successful zero-row fetch', fakeAsync(() => {
    const store = createStore();
    store.connect(new RecordingDataSource());

    store.setTextFilter('missing');
    tick(TEXT_FILTER_DEBOUNCE_MS);

    expect(store.hasFetched()).toBe(true);
    expect(store.isEmpty()).toBe(true);
    expect(store.loadState()).toEqual({ kind: 'empty', stale: false });
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

      expect(store.error()).toEqual({ kind: 'unknown', message: 'boom', retryable: false });
      expect(store.errorMessage()).toBe('boom');
      expect(store.loading()).toBe(false);
      expect(store.rows()).toEqual([]);
      expect(store.hasFetched()).toBe(true);
      expect(store.loadState()).toEqual({
        kind: 'error',
        error: { kind: 'unknown', message: 'boom', retryable: false },
      });
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
      expect(store.errorMessage()).toBe('boom');

      store.refresh();

      expect(store.error()).toBeNull();
      expect(store.rows()).toHaveLength(2);
    });

    it('keeps last good data in the error load state', () => {
      const store = createStore();
      let failNext = false;
      store.connect({
        fetch: (query) => {
          if (failNext) {
            return throwError(() => new Error('boom'));
          }
          return new RecordingDataSource().fetch(query);
        },
      });
      failNext = true;

      store.refresh();

      expect(store.loadState()).toEqual({
        kind: 'error',
        error: { kind: 'unknown', message: 'boom', retryable: false },
        data: { rows: store.rows(), totalCount: 5, pageIndex: 0, pageSize: 2 },
      });
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
      expect(store.errorMessage()).toBe('nope');

      store.refresh();

      expect(store.error()).toBeNull();
      expect(store.loading()).toBe(true);
    });
  });

  describe('telemetry', () => {
    it('emits redacted query lifecycle events with hashes and durations', fakeAsync(() => {
      const events: ReportTelemetryEvent[] = [];
      const store = createStoreWithTelemetry(events);
      const dataSource = new RecordingDataSource();

      store.connect(dataSource);
      store.setTextFilter('Acme');
      tick(TEXT_FILTER_DEBOUNCE_MS);

      expect(events.map((event) => event.type)).toEqual([
        'report.fetch_started',
        'report.fetch_succeeded',
        'report.query_changed',
        'report.fetch_started',
        'report.fetch_succeeded',
      ]);
      expect(events.every((event) => event.reportId === 'invoices')).toBe(true);
      expect(events[2]).toMatchObject({
        type: 'report.query_changed',
        queryHash: dataQueryHash(dataSource.queries[1]),
      });
      const success = events[4];
      expect(success).toMatchObject({
        type: 'report.fetch_succeeded',
        queryHash: dataQueryHash(dataSource.queries[1]),
        rowCount: 2,
        totalCount: 2,
      });
      expect(success.type === 'report.fetch_succeeded' && success.durationMs).toEqual(expect.any(Number));
      expect(JSON.stringify(events)).not.toContain('Acme');
    }));

    it('emits empty_result and fetch_failed with hashes and no raw error message', fakeAsync(() => {
      const events: ReportTelemetryEvent[] = [];
      const store = createStoreWithTelemetry(events);
      let failNext = false;
      store.connect({
        fetch: (query) => {
          if (failNext) {
            return throwError(() => new Error('Sensitive customer text'));
          }
          return new RecordingDataSource().fetch(query);
        },
      });

      store.setTextFilter('missing');
      tick(TEXT_FILTER_DEBOUNCE_MS);
      failNext = true;
      store.refresh();

      expect(events.some((event) => event.type === 'report.empty_result')).toBe(true);
      const failure = events.find((event) => event.type === 'report.fetch_failed');
      expect(failure).toMatchObject({
        type: 'report.fetch_failed',
        errorKind: 'unknown',
        retryable: false,
      });
      expect(failure?.type === 'report.fetch_failed' && failure.durationMs).toEqual(expect.any(Number));
      expect(JSON.stringify(events)).not.toContain('missing');
      expect(JSON.stringify(events)).not.toContain('Sensitive customer text');
    }));
  });
});
