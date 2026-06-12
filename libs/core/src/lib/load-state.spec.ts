import {
  isEmpty,
  isError,
  isIdle,
  isLoading,
  isRefreshing,
  isStale,
  isSuccess,
  loadStateData,
  type LoadState,
} from './load-state';
import type { ReportError } from './report-error';

interface Page {
  readonly rows: readonly string[];
}

const PAGE: Page = { rows: ['a', 'b'] };

const ERROR: ReportError = {
  kind: 'network',
  message: 'offline',
  retryable: true,
};

const IDLE: LoadState<Page> = { kind: 'idle' };
const LOADING: LoadState<Page> = { kind: 'loading' };
const REFRESHING: LoadState<Page> = { kind: 'refreshing', data: PAGE };
const SUCCESS: LoadState<Page> = { kind: 'success', data: PAGE, stale: false };
const SUCCESS_STALE: LoadState<Page> = { kind: 'success', data: PAGE, stale: true };
const EMPTY: LoadState<Page> = { kind: 'empty', stale: false };
const EMPTY_STALE: LoadState<Page> = { kind: 'empty', stale: true };
const ERROR_BARE: LoadState<Page> = { kind: 'error', error: ERROR };
const ERROR_WITH_DATA: LoadState<Page> = { kind: 'error', error: ERROR, data: PAGE };

const ALL_STATES: readonly LoadState<Page>[] = [
  IDLE,
  LOADING,
  REFRESHING,
  SUCCESS,
  SUCCESS_STALE,
  EMPTY,
  EMPTY_STALE,
  ERROR_BARE,
  ERROR_WITH_DATA,
];

describe('LoadState guards', () => {
  it('isIdle matches exactly the idle kind', () => {
    for (const state of ALL_STATES) {
      expect(isIdle(state)).toBe(state.kind === 'idle');
    }
  });

  it('isLoading matches exactly the loading kind', () => {
    for (const state of ALL_STATES) {
      expect(isLoading(state)).toBe(state.kind === 'loading');
    }
  });

  it('isRefreshing matches exactly the refreshing kind', () => {
    for (const state of ALL_STATES) {
      expect(isRefreshing(state)).toBe(state.kind === 'refreshing');
    }
  });

  it('isSuccess matches exactly the success kind', () => {
    for (const state of ALL_STATES) {
      expect(isSuccess(state)).toBe(state.kind === 'success');
    }
  });

  it('isEmpty matches exactly the empty kind', () => {
    for (const state of ALL_STATES) {
      expect(isEmpty(state)).toBe(state.kind === 'empty');
    }
  });

  it('isError matches exactly the error kind', () => {
    for (const state of ALL_STATES) {
      expect(isError(state)).toBe(state.kind === 'error');
    }
  });

  it('guards narrow the union so members are reachable', () => {
    const state: LoadState<Page> = SUCCESS;
    if (isSuccess(state)) {
      expect(state.data).toBe(PAGE);
      expect(state.stale).toBe(false);
    }
    const failed: LoadState<Page> = ERROR_WITH_DATA;
    if (isError(failed)) {
      expect(failed.error).toBe(ERROR);
      expect(failed.data).toBe(PAGE);
    }
    const inFlight: LoadState<Page> = REFRESHING;
    if (isRefreshing(inFlight)) {
      expect(inFlight.data).toBe(PAGE);
    }
  });
});

describe('loadStateData', () => {
  it('returns the data for refreshing', () => {
    expect(loadStateData(REFRESHING)).toBe(PAGE);
  });

  it('returns the data for success (stale or not)', () => {
    expect(loadStateData(SUCCESS)).toBe(PAGE);
    expect(loadStateData(SUCCESS_STALE)).toBe(PAGE);
  });

  it('returns the retained last-good data for error', () => {
    expect(loadStateData(ERROR_WITH_DATA)).toBe(PAGE);
  });

  it('returns undefined for idle, loading, empty, and data-less error', () => {
    expect(loadStateData(IDLE)).toBeUndefined();
    expect(loadStateData(LOADING)).toBeUndefined();
    expect(loadStateData(EMPTY)).toBeUndefined();
    expect(loadStateData(EMPTY_STALE)).toBeUndefined();
    expect(loadStateData(ERROR_BARE)).toBeUndefined();
  });
});

describe('isStale', () => {
  it('is true only for settled data-bearing kinds flagged stale', () => {
    expect(isStale(SUCCESS_STALE)).toBe(true);
    expect(isStale(EMPTY_STALE)).toBe(true);
  });

  it('is false for fresh settled kinds and every non-settled kind', () => {
    expect(isStale(SUCCESS)).toBe(false);
    expect(isStale(EMPTY)).toBe(false);
    expect(isStale(IDLE)).toBe(false);
    expect(isStale(LOADING)).toBe(false);
    expect(isStale(REFRESHING)).toBe(false);
    expect(isStale(ERROR_BARE)).toBe(false);
    expect(isStale(ERROR_WITH_DATA)).toBe(false);
  });
});
