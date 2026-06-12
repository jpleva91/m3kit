/**
 * Dependency-free chart math shared by the @m3kit/charts components:
 * linear scales, "nice" axis ticks, SVG path builders, and donut arc
 * geometry. Pure functions only — everything here is unit-tested with
 * exact expectations.
 */

/** A point in SVG user space (already scaled). */
export interface ScalePoint {
  readonly x: number;
  readonly y: number;
}

/** One donut segment expressed as fractions of the full circle. */
export interface DonutSegment {
  /** Fraction of the circle (0..1) at which the segment starts. */
  readonly start: number;
  /** Fraction of the circle (0..1) the segment covers. */
  readonly fraction: number;
}

/** Number of categorical series tokens the theme contract guarantees. */
export const CHART_SERIES_TOKEN_COUNT = 6;

/** Rounds to two decimals to keep SVG attributes compact and stable. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * `var(--app-chart-N)` for a zero-based series index, cycling through
 * the closed six-token palette (series 6 wraps back to `--app-chart-1`).
 */
export function chartSeriesColor(index: number): string {
  const slot = (((index % CHART_SERIES_TOKEN_COUNT) + CHART_SERIES_TOKEN_COUNT) %
    CHART_SERIES_TOKEN_COUNT) + 1;
  return `var(--app-chart-${slot})`;
}

/**
 * Linear scale mapping `domain` onto `range`. A zero-span domain maps
 * every value to the range midpoint so single-point series still render.
 */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  const span = domainMax - domainMin;
  if (span === 0) {
    const midpoint = (rangeMin + rangeMax) / 2;
    return () => midpoint;
  }
  const factor = (rangeMax - rangeMin) / span;
  return (value: number) => rangeMin + (value - domainMin) * factor;
}

/**
 * "Nice" axis ticks covering `[min, max]` in about `maxTicks`
 * round-numbered steps (1/2/5 × 10^k). The returned ticks always
 * enclose the input extent, so `[ticks[0], ticks[at(-1)]]` is a ready
 * axis domain. A zero-span extent is widened toward zero (`[5, 5]`
 * ticks `[0..5]`; `[0, 0]` returns `[0, 1]`).
 */
export function niceTicks(min: number, max: number, maxTicks = 5): readonly number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [];
  }
  if (min > max) {
    return niceTicks(max, min, maxTicks);
  }
  if (min === max) {
    return min === 0 ? [0, 1] : niceTicks(Math.min(min, 0), Math.max(max, 0), maxTicks);
  }
  const step = niceNumber(niceNumber(max - min, false) / (maxTicks - 1), true);
  const start = Math.floor(min / step) * step;
  const stop = Math.ceil(max / step) * step;
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const ticks: number[] = [];
  for (let tick = start; tick <= stop + step / 2; tick += step) {
    ticks.push(Number(tick.toFixed(decimals)));
  }
  return ticks;
}

/** Nearest "nice" number (1/2/5 × 10^k) to `value`, floor or round. */
function niceNumber(value: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction: number;
  if (round) {
    niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  } else {
    niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  }
  return niceFraction * 10 ** exponent;
}

/** SVG path (`M … L …`) through already-scaled points. */
export function linePath(points: readonly ScalePoint[]): string {
  return points
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${round2(point.x)},${round2(point.y)}`)
    .join(' ');
}

/**
 * Closed SVG area path: the line through `points`, dropped to
 * `baselineY` and closed back to the first point.
 */
export function areaPath(points: readonly ScalePoint[], baselineY: number): string {
  if (points.length === 0) {
    return '';
  }
  const first = points[0];
  const last = points[points.length - 1];
  const base = round2(baselineY);
  return `${linePath(points)} L${round2(last.x)},${base} L${round2(first.x)},${base} Z`;
}

/**
 * Splits `values` into donut segments as fractions of the whole circle,
 * in input order. Non-positive values contribute zero-width segments
 * (they keep their slot so colors stay aligned with input order); an
 * all-zero input yields all-zero fractions instead of dividing by zero.
 */
export function donutSegments(values: readonly number[]): readonly DonutSegment[] {
  const clamped = values.map((value) => (value > 0 ? value : 0));
  const total = clamped.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  return clamped.map((value) => {
    const fraction = total === 0 ? 0 : value / total;
    const segment: DonutSegment = { start: cursor, fraction };
    cursor += fraction;
    return segment;
  });
}
