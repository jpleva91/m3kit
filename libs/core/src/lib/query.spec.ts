import { createDefaultQuery, createEmptyPage, DEFAULT_PAGE_SIZE } from './query';

describe('createDefaultQuery', () => {
  it('creates a neutral query with the default page size', () => {
    expect(createDefaultQuery()).toEqual({
      filter: {},
      sort: null,
      page: { index: 0, size: DEFAULT_PAGE_SIZE },
    });
  });

  it('honors an explicit page size', () => {
    expect(createDefaultQuery(10).page).toEqual({ index: 0, size: 10 });
  });
});

describe('createEmptyPage', () => {
  it('creates an empty page mirroring the default query', () => {
    expect(createEmptyPage()).toEqual({
      rows: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it('mirrors the page state of the supplied query', () => {
    const query = { filter: {}, sort: null, page: { index: 3, size: 50 } };
    expect(createEmptyPage(query)).toEqual({
      rows: [],
      totalCount: 0,
      pageIndex: 3,
      pageSize: 50,
    });
  });
});
