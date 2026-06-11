import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { injectHostWidth } from './internal/host-width';
import { chartSeriesColor, linearScale, niceTicks, round2 } from './internal/scale';

/** One named series; `values` align with the chart's `categories`. */
export interface BarChartSeries {
  readonly name: string;
  readonly values: readonly number[];
}

/** Side-by-side bars per category, or one segmented bar per category. */
export type BarChartMode = 'grouped' | 'stacked';

/** One rendered bar (or stack segment). */
interface BarRectView {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly categoryIndex: number;
  readonly seriesIndex: number;
}

/** A positioned tick label on either axis. */
interface AxisTickView {
  readonly pos: number;
  readonly label: string;
}

/** Full render model produced once per input change. */
interface BarChartView {
  readonly bars: readonly BarRectView[];
  readonly valueTicks: readonly AxisTickView[];
  readonly categoryTicks: readonly AxisTickView[];
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/** Plot margins (vertical bars); horizontal bars widen the left gutter. */
const MARGIN = { top: 12, right: 12, bottom: 28, left: 44 } as const;

/** Left gutter for horizontal mode, where category names sit on the left. */
const HORIZONTAL_LEFT = 88;

/** Fraction of each category band left as padding (split across sides). */
const BAND_PADDING = 0.3;

/**
 * Dependency-free SVG bar chart: grouped or stacked, vertical or
 * horizontal. The SVG fills the host (`width: 100%`) and uses the
 * measured host width as its viewBox width, so one SVG unit equals one
 * CSS px and text labels never stretch. Series colors cycle the closed
 * `--app-chart-1..6` palette; value-axis ticks are "nice" round
 * numbers. Stacking assumes
 * non-negative values (negative values are clamped to zero in stacked
 * mode; grouped mode renders them below the zero baseline).
 *
 * ```html
 * <rpt-bar-chart
 *   [categories]="['Q1', 'Q2', 'Q3']"
 *   [series]="[{ name: 'Paid', values: [42, 38, 51] }]"
 *   mode="stacked"
 * />
 * ```
 */
@Component({
  selector: 'rpt-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  /** Category labels along the category axis. */
  readonly categories = input.required<readonly string[]>();

  /** Series; each `values` entry pairs with the same-index category. */
  readonly series = input.required<readonly BarChartSeries[]>();

  /** Bars side by side per category, or stacked into one bar. */
  readonly mode = input<BarChartMode>('grouped');

  /** Lays categories on the y axis and values on the x axis. */
  readonly horizontal = input<boolean>(false);

  /** Rendered height in px (also the viewBox height). */
  readonly height = input<number>(240);

  /** Accessible description of the chart (`role="img"`). */
  readonly ariaLabel = input<string>('Bar chart');

  /** Host width in CSS px, doubling as the viewBox width. */
  private readonly hostWidth = injectHostWidth();

  protected readonly viewBox = computed<string>(
    () => `0 0 ${this.hostWidth()} ${this.height()}`,
  );

  /** Render model, or `null` when there is nothing to plot. */
  protected readonly view = computed<BarChartView | null>(() => {
    const categories = this.categories();
    const series = this.series();
    if (categories.length === 0 || series.length === 0) {
      return null;
    }

    const horizontal = this.horizontal();
    const stacked = this.mode() === 'stacked';
    const left = horizontal ? HORIZONTAL_LEFT : MARGIN.left;
    const right = this.hostWidth() - MARGIN.right;
    const top = MARGIN.top;
    const bottom = this.height() - MARGIN.bottom;

    const tickValues = niceTicks(...valueExtent(categories.length, series, stacked));
    const domain: readonly [number, number] = [tickValues[0], tickValues[tickValues.length - 1]];
    // Values scale bottom→top vertically, left→right horizontally.
    const valueScale = horizontal
      ? linearScale(domain, [left, right])
      : linearScale(domain, [bottom, top]);
    const zero = valueScale(Math.min(Math.max(0, domain[0]), domain[1]));

    // Category bands along the other axis, padded on both sides.
    const bandStart = horizontal ? top : left;
    const bandEnd = horizontal ? bottom : right;
    const band = (bandEnd - bandStart) / categories.length;
    const inset = (band * BAND_PADDING) / 2;
    const usable = band * (1 - BAND_PADDING);
    const thickness = stacked ? usable : usable / series.length;

    const bars: BarRectView[] = [];
    categories.forEach((_, c) => {
      let cumulative = zero;
      series.forEach((s, i) => {
        const value = stacked ? Math.max(0, s.values[c] ?? 0) : (s.values[c] ?? 0);
        const along = bandStart + c * band + inset + (stacked ? 0 : i * thickness);
        const scaled = valueScale(value);
        // Stacked segments start where the previous one ended; grouped
        // bars grow from the zero baseline (negatives grow past it).
        const from = stacked ? cumulative : zero;
        const to = stacked ? cumulative + (scaled - zero) : scaled;
        cumulative = to;
        bars.push(
          horizontal
            ? {
                x: round2(Math.min(from, to)),
                y: round2(along),
                width: round2(Math.abs(to - from)),
                height: round2(thickness),
                color: chartSeriesColor(i),
                categoryIndex: c,
                seriesIndex: i,
              }
            : {
                x: round2(along),
                y: round2(Math.min(from, to)),
                width: round2(thickness),
                height: round2(Math.abs(to - from)),
                color: chartSeriesColor(i),
                categoryIndex: c,
                seriesIndex: i,
              },
        );
      });
    });

    return {
      bars,
      valueTicks: tickValues.map(
        (tick): AxisTickView => ({ pos: round2(valueScale(tick)), label: String(tick) }),
      ),
      categoryTicks: categories.map(
        (label, c): AxisTickView => ({ pos: round2(bandStart + c * band + band / 2), label }),
      ),
      left,
      right,
      top,
      bottom,
    };
  });
}

/** Value extent to cover: grouped spans raw values, stacked spans sums. */
function valueExtent(
  categoryCount: number,
  series: readonly BarChartSeries[],
  stacked: boolean,
): readonly [number, number] {
  if (stacked) {
    const sums = Array.from({ length: categoryCount }, (_, c) =>
      series.reduce((sum, s) => sum + Math.max(0, s.values[c] ?? 0), 0),
    );
    return [0, Math.max(0, ...sums)];
  }
  const values = series.flatMap((s) => s.values.slice(0, categoryCount));
  return [Math.min(0, ...values), Math.max(0, ...values)];
}
