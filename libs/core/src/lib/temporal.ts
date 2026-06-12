/**
 * Locale, timezone, and currency policy that reports format values
 * against. Exports and renderers receive one policy object instead of
 * scattered locale parameters.
 */
export interface ReportFormattingPolicy {
  /** BCP 47 locale tag for number/date formatting (e.g. `'en-US'`). */
  readonly locale: string;
  /** IANA timezone identifier (e.g. `'America/New_York'`). */
  readonly timeZone: string;
  /** Optional ISO 4217 currency code for currency values (e.g. `'USD'`). */
  readonly currencyCode?: string;
}

/**
 * A range of time expressed as UTC instants (ISO 8601 strings, e.g.
 * `'2026-06-12T04:00:00.000Z'`).
 *
 * The kit-wide convention is **half-open `[start, end)`**: `start` is
 * inclusive, `end` is exclusive. Adjacent ranges therefore tile without
 * gaps or double-counting, and backend range filters translate directly
 * to `>= start AND < end`.
 */
export interface DateRange {
  /** Inclusive lower bound, as a UTC ISO instant. */
  readonly start: string;
  /** Exclusive upper bound, as a UTC ISO instant. */
  readonly end: string;
}

/**
 * Closed vocabulary of relative date ranges a report can offer. All keys
 * resolve against the *local calendar* of an IANA timezone (see
 * {@link resolveDateRange}); `last7days`/`last30days` are the 7/30
 * calendar days ending with (and including) today.
 */
export type RelativeDateRangeKey =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear';

/** All members of the {@link RelativeDateRangeKey} vocabulary, in stable order. */
export const RELATIVE_DATE_RANGE_KEYS: readonly RelativeDateRangeKey[] = [
  'today',
  'yesterday',
  'last7days',
  'last30days',
  'thisMonth',
  'lastMonth',
  'thisYear',
];

/** A calendar date in some local timezone. `month` and `day` are 1-based. */
interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** Cached per-timezone wall-clock formatters (creation is expensive). */
const WALL_CLOCK_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = WALL_CLOCK_FORMATTERS.get(timeZone);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    WALL_CLOCK_FORMATTERS.set(timeZone, formatter);
  }
  return formatter;
}

/** Reads the wall-clock fields of `instant` as seen in `timeZone`. */
function wallClockParts(instant: Date, timeZone: string): Record<string, number> {
  const values: Record<string, number> = {};
  for (const part of wallClockFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }
  return values;
}

/**
 * UTC offset of `timeZone` at `instant`, in milliseconds (positive when
 * the zone is ahead of UTC). Derived purely from `Intl` by comparing the
 * zone's wall clock against the instant itself.
 */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = wallClockParts(instant, timeZone);
  const wallClockAsUtc = Date.UTC(
    parts['year'],
    parts['month'] - 1,
    parts['day'],
    parts['hour'],
    parts['minute'],
    parts['second'],
  );
  // Wall clocks carry second precision; compare at second precision too.
  const instantSeconds = instant.getTime() - instant.getMilliseconds();
  return wallClockAsUtc - instantSeconds;
}

/** The local calendar date on which `instant` falls in `timeZone`. */
function localCalendarDate(instant: Date, timeZone: string): CalendarDate {
  const parts = wallClockParts(instant, timeZone);
  return { year: parts['year'], month: parts['month'], day: parts['day'] };
}

/**
 * Pure proleptic-Gregorian day arithmetic on a calendar date. Performed
 * via `Date.UTC` overflow, which is timezone-independent.
 */
function addDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** First day of the month `monthOffset` months away from `date`'s month. */
function firstOfMonth(date: CalendarDate, monthOffset: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1 + monthOffset, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: 1,
  };
}

/**
 * The UTC instant at which `date` begins (local midnight) in `timeZone`.
 *
 * Solved iteratively: guess the instant assuming a zero offset, measure
 * the zone's actual offset at the guess, and correct once more — the
 * second pass lands on the right side of DST transitions. When local
 * midnight does not exist (a spring-forward gap at midnight), the
 * resolved instant is the moment the clock jumps past it.
 */
function startOfLocalDay(date: CalendarDate, timeZone: string): Date {
  const wallClockAsUtc = Date.UTC(date.year, date.month - 1, date.day);
  const firstGuess = wallClockAsUtc - timeZoneOffsetMs(new Date(wallClockAsUtc), timeZone);
  const offset = timeZoneOffsetMs(new Date(firstGuess), timeZone);
  return new Date(wallClockAsUtc - offset);
}

function toRange(start: CalendarDate, end: CalendarDate, timeZone: string): DateRange {
  return {
    start: startOfLocalDay(start, timeZone).toISOString(),
    end: startOfLocalDay(end, timeZone).toISOString(),
  };
}

/**
 * Resolves a {@link RelativeDateRangeKey} to a concrete half-open
 * {@link DateRange} of UTC instants, anchored at the reference instant
 * `now` and computed against the *local calendar* of the given IANA
 * `timeZone` — implemented with `Intl` only, no date library.
 *
 * Boundaries fall on local-calendar boundaries (local midnight, first of
 * month, first of year) converted to UTC, so DST days yield 23/25-hour
 * ranges and "today" near midnight differs between zones ahead of and
 * behind UTC, as users expect.
 */
export function resolveDateRange(
  key: RelativeDateRangeKey,
  now: Date,
  timeZone: string,
): DateRange {
  const today = localCalendarDate(now, timeZone);
  switch (key) {
    case 'today':
      return toRange(today, addDays(today, 1), timeZone);
    case 'yesterday':
      return toRange(addDays(today, -1), today, timeZone);
    case 'last7days':
      return toRange(addDays(today, -6), addDays(today, 1), timeZone);
    case 'last30days':
      return toRange(addDays(today, -29), addDays(today, 1), timeZone);
    case 'thisMonth':
      return toRange(firstOfMonth(today, 0), firstOfMonth(today, 1), timeZone);
    case 'lastMonth':
      return toRange(firstOfMonth(today, -1), firstOfMonth(today, 0), timeZone);
    case 'thisYear':
      return toRange(
        { year: today.year, month: 1, day: 1 },
        { year: today.year + 1, month: 1, day: 1 },
        timeZone,
      );
  }
}
