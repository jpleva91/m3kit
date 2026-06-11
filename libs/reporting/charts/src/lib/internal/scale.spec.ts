import {
  areaPath,
  chartSeriesColor,
  donutSegments,
  linearScale,
  linePath,
  niceTicks,
  round2,
} from './scale';

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(2.345)).toBe(2.35);
    expect(round2(2.344)).toBe(2.34);
    expect(round2(-1.005)).toBe(-1);
    expect(round2(7)).toBe(7);
  });
});

describe('chartSeriesColor', () => {
  it('maps zero-based indices onto the one-based token slots', () => {
    expect(chartSeriesColor(0)).toBe('var(--app-chart-1)');
    expect(chartSeriesColor(5)).toBe('var(--app-chart-6)');
  });

  it('cycles after the sixth series', () => {
    expect(chartSeriesColor(6)).toBe('var(--app-chart-1)');
    expect(chartSeriesColor(13)).toBe('var(--app-chart-2)');
  });
});

describe('linearScale', () => {
  it('maps the domain linearly onto the range', () => {
    const scale = linearScale([0, 10], [0, 100]);
    expect(scale(0)).toBe(0);
    expect(scale(5)).toBe(50);
    expect(scale(10)).toBe(100);
  });

  it('supports inverted ranges (SVG y-down axes)', () => {
    const scale = linearScale([0, 10], [100, 4]);
    expect(scale(0)).toBe(100);
    expect(scale(10)).toBe(4);
    expect(scale(5)).toBe(52);
  });

  it('extrapolates outside the domain', () => {
    const scale = linearScale([0, 10], [0, 100]);
    expect(scale(-1)).toBe(-10);
    expect(scale(12)).toBe(120);
  });

  it('maps a zero-span domain to the range midpoint', () => {
    const scale = linearScale([5, 5], [0, 100]);
    expect(scale(5)).toBe(50);
    expect(scale(999)).toBe(50);
  });
});

describe('niceTicks', () => {
  it('produces round steps that enclose the extent', () => {
    expect(niceTicks(0, 10)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(3, 97)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('handles fractional extents without floating-point drift', () => {
    expect(niceTicks(0, 0.95)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('handles negative extents', () => {
    expect(niceTicks(-42, 38)).toEqual([-60, -40, -20, 0, 20, 40]);
  });

  it('widens a zero-span extent toward zero', () => {
    expect(niceTicks(5, 5)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(niceTicks(0, 0)).toEqual([0, 1]);
    expect(niceTicks(-3, -3)).toEqual([-3, -2, -1, 0]);
  });

  it('swaps a reversed extent', () => {
    expect(niceTicks(10, 0)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('returns no ticks for a non-finite extent', () => {
    expect(niceTicks(Number.NaN, 10)).toEqual([]);
    expect(niceTicks(0, Number.POSITIVE_INFINITY)).toEqual([]);
  });

  it('respects the maximum tick count', () => {
    expect(niceTicks(0, 100, 3).length).toBeLessThanOrEqual(4);
    expect(niceTicks(0, 100, 3)).toEqual([0, 50, 100]);
  });
});

describe('linePath', () => {
  it('builds a move-then-line path with two-decimal precision', () => {
    expect(
      linePath([
        { x: 0, y: 10 },
        { x: 50, y: 2.345 },
        { x: 100, y: 0 },
      ]),
    ).toBe('M0,10 L50,2.35 L100,0');
  });

  it('renders a lone point as a bare move command', () => {
    expect(linePath([{ x: 30, y: 40 }])).toBe('M30,40');
  });

  it('returns an empty path for no points', () => {
    expect(linePath([])).toBe('');
  });
});

describe('areaPath', () => {
  it('closes the line down to the baseline and back', () => {
    expect(
      areaPath(
        [
          { x: 0, y: 10 },
          { x: 50, y: 2.345 },
        ],
        30,
      ),
    ).toBe('M0,10 L50,2.35 L50,30 L0,30 Z');
  });

  it('returns an empty path for no points', () => {
    expect(areaPath([], 30)).toBe('');
  });
});

describe('donutSegments', () => {
  it('splits values into circle fractions in input order', () => {
    expect(donutSegments([1, 1, 2])).toEqual([
      { start: 0, fraction: 0.25 },
      { start: 0.25, fraction: 0.25 },
      { start: 0.5, fraction: 0.5 },
    ]);
  });

  it('keeps zero-value slots so colors stay aligned with input order', () => {
    expect(donutSegments([3, 0, 1])).toEqual([
      { start: 0, fraction: 0.75 },
      { start: 0.75, fraction: 0 },
      { start: 0.75, fraction: 0.25 },
    ]);
  });

  it('treats negative values as zero', () => {
    expect(donutSegments([-5, 4])).toEqual([
      { start: 0, fraction: 0 },
      { start: 0, fraction: 1 },
    ]);
  });

  it('yields all-zero fractions for an all-zero input', () => {
    expect(donutSegments([0, 0])).toEqual([
      { start: 0, fraction: 0 },
      { start: 0, fraction: 0 },
    ]);
  });

  it('returns an empty list for no values', () => {
    expect(donutSegments([])).toEqual([]);
  });
});
