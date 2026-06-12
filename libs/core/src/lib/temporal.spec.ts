import { RELATIVE_DATE_RANGE_KEYS, resolveDateRange } from './temporal';

const HOUR_MS = 60 * 60 * 1000;

function durationHours(range: { start: string; end: string }): number {
  return (Date.parse(range.end) - Date.parse(range.start)) / HOUR_MS;
}

describe('resolveDateRange', () => {
  describe('in UTC', () => {
    const now = new Date('2026-06-12T15:30:00Z');

    it('resolves today as the half-open local calendar day', () => {
      expect(resolveDateRange('today', now, 'UTC')).toEqual({
        start: '2026-06-12T00:00:00.000Z',
        end: '2026-06-13T00:00:00.000Z',
      });
    });

    it('resolves yesterday', () => {
      expect(resolveDateRange('yesterday', now, 'UTC')).toEqual({
        start: '2026-06-11T00:00:00.000Z',
        end: '2026-06-12T00:00:00.000Z',
      });
    });

    it('resolves last7days as the 7 calendar days ending with today', () => {
      expect(resolveDateRange('last7days', now, 'UTC')).toEqual({
        start: '2026-06-06T00:00:00.000Z',
        end: '2026-06-13T00:00:00.000Z',
      });
    });

    it('resolves last30days as the 30 calendar days ending with today', () => {
      expect(resolveDateRange('last30days', now, 'UTC')).toEqual({
        start: '2026-05-14T00:00:00.000Z',
        end: '2026-06-13T00:00:00.000Z',
      });
    });

    it('resolves thisMonth as first-of-month to first-of-next-month', () => {
      expect(resolveDateRange('thisMonth', now, 'UTC')).toEqual({
        start: '2026-06-01T00:00:00.000Z',
        end: '2026-07-01T00:00:00.000Z',
      });
    });

    it('resolves lastMonth', () => {
      expect(resolveDateRange('lastMonth', now, 'UTC')).toEqual({
        start: '2026-05-01T00:00:00.000Z',
        end: '2026-06-01T00:00:00.000Z',
      });
    });

    it('resolves thisYear', () => {
      expect(resolveDateRange('thisYear', now, 'UTC')).toEqual({
        start: '2026-01-01T00:00:00.000Z',
        end: '2027-01-01T00:00:00.000Z',
      });
    });

    it('tiles adjacent ranges without gap or overlap (half-open semantics)', () => {
      const yesterday = resolveDateRange('yesterday', now, 'UTC');
      const today = resolveDateRange('today', now, 'UTC');
      expect(yesterday.end).toBe(today.start);
    });
  });

  describe('month-length edges', () => {
    it('resolves lastMonth across a year boundary on Jan 31', () => {
      const now = new Date('2026-01-31T12:00:00Z');
      expect(resolveDateRange('lastMonth', now, 'UTC')).toEqual({
        start: '2025-12-01T00:00:00.000Z',
        end: '2026-01-01T00:00:00.000Z',
      });
    });

    it('resolves lastMonth into a shorter month on Mar 31', () => {
      const now = new Date('2026-03-31T12:00:00Z');
      expect(resolveDateRange('lastMonth', now, 'UTC')).toEqual({
        start: '2026-02-01T00:00:00.000Z',
        end: '2026-03-01T00:00:00.000Z',
      });
    });
  });

  describe('in a zone behind UTC (America/New_York)', () => {
    it('anchors today on the local calendar date, not the UTC date', () => {
      // 2026-06-12T01:00Z is still June 11, 21:00 in New York (UTC-4).
      const now = new Date('2026-06-12T01:00:00Z');
      expect(resolveDateRange('today', now, 'America/New_York')).toEqual({
        start: '2026-06-11T04:00:00.000Z',
        end: '2026-06-12T04:00:00.000Z',
      });
    });

    it('produces a 23-hour today on the spring-forward DST transition', () => {
      // US DST begins 2026-03-08 at 02:00 local: EST midnight start,
      // EDT midnight end.
      const now = new Date('2026-03-08T18:00:00Z');
      const range = resolveDateRange('today', now, 'America/New_York');
      expect(range).toEqual({
        start: '2026-03-08T05:00:00.000Z',
        end: '2026-03-09T04:00:00.000Z',
      });
      expect(durationHours(range)).toBe(23);
    });

    it('produces a 25-hour today on the fall-back DST transition', () => {
      // US DST ends 2026-11-01 at 02:00 local: EDT midnight start,
      // EST midnight end.
      const now = new Date('2026-11-01T12:00:00Z');
      const range = resolveDateRange('today', now, 'America/New_York');
      expect(range).toEqual({
        start: '2026-11-01T04:00:00.000Z',
        end: '2026-11-02T05:00:00.000Z',
      });
      expect(durationHours(range)).toBe(25);
    });
  });

  describe('in a zone ahead of UTC (Pacific/Auckland)', () => {
    // 2026-03-31T20:00Z is already April 1, 09:00 in Auckland (NZDT, UTC+13).
    const now = new Date('2026-03-31T20:00:00Z');

    it('anchors today on the local calendar date ahead of the UTC date', () => {
      expect(resolveDateRange('today', now, 'Pacific/Auckland')).toEqual({
        start: '2026-03-31T11:00:00.000Z',
        end: '2026-04-01T11:00:00.000Z',
      });
    });

    it('resolves lastMonth from the local month, with NZDT offsets', () => {
      // Local date is Apr 1, so last month is March — even though the
      // UTC date is still March 31.
      expect(resolveDateRange('lastMonth', now, 'Pacific/Auckland')).toEqual({
        start: '2026-02-28T11:00:00.000Z',
        end: '2026-03-31T11:00:00.000Z',
      });
    });
  });

  it('resolves every vocabulary key to a non-empty half-open range', () => {
    const now = new Date('2026-06-12T15:30:00Z');
    for (const key of RELATIVE_DATE_RANGE_KEYS) {
      const range = resolveDateRange(key, now, 'America/New_York');
      expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(Date.parse(range.start)).toBeLessThan(Date.parse(range.end));
    }
  });
});
