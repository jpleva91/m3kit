import { createDefaultQuery, encodeDataQueryParam, type ColumnViewState, type DataQuery } from '@m3kit/core';

import {
  readReportUrlState,
  REPORT_QUERY_PARAM,
  syncReportUrlQuery,
} from './report-url-state';

function routeWithQueryParam(value: string | null) {
  return {
    snapshot: {
      queryParamMap: {
        get: vi.fn((key: string) => (key === REPORT_QUERY_PARAM ? value : null)),
      },
    },
  };
}

describe('report URL state', () => {
  const query: DataQuery = {
    filter: {
      text: 'overdue',
      fields: { status: 'overdue', customerName: 'Acme Instruments' },
    },
    sort: { key: 'dueAt', direction: 'desc' },
    page: { index: 2, size: 10 },
  };

  it('round-trips a data query through the q query parameter', async () => {
    const route = routeWithQueryParam(encodeDataQueryParam(query));
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    expect(readReportUrlState(route).query).toEqual(query);
    await expect(syncReportUrlQuery(router, route, query)).resolves.toBe(true);

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { [REPORT_QUERY_PARAM]: encodeDataQueryParam(query) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('degrades missing, tampered, or garbage q values to the provided default query', () => {
    const defaultQuery = createDefaultQuery(10);

    expect(readReportUrlState(routeWithQueryParam(null), defaultQuery).query).toEqual(
      defaultQuery,
    );
    expect(readReportUrlState(routeWithQueryParam('not-json'), defaultQuery).query).toEqual(
      defaultQuery,
    );
    expect(
      readReportUrlState(
        routeWithQueryParam(JSON.stringify({ v: 999, page: { index: 0, size: 10 } })),
        defaultQuery,
      ).query,
    ).toEqual(defaultQuery);
  });

  it('carries optional applied-view column state without encoding it into q', async () => {
    const columns: readonly ColumnViewState[] = [
      { key: 'number', pinned: 'start', width: '9rem' },
      { key: 'internalNotes', visible: false },
    ];
    const route = routeWithQueryParam(encodeDataQueryParam(query));
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    expect(readReportUrlState(route, createDefaultQuery(), columns)).toEqual({
      query,
      columnState: columns,
    });

    await syncReportUrlQuery(router, route, query);

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { [REPORT_QUERY_PARAM]: encodeDataQueryParam(query) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
