import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { lineChartAccessibilitySummary } from './chart-a11y';
import { injectHostWidth } from './internal/host-width';
import {
  areaPath,
  chartSeriesColor,
  linearScale,
  linePath,
  niceTicks,
  round2,
} from './internal/scale';

/** Horizontal position of a line-chart point. */
export type LineChartX = number | string | Date;

/** One data point in a {@link LineChartSeries}. */
export interface LineChartPoint {
  readonly x: LineChartX;
  readonly y: number;
}

/** One named series rendered as a polyline (and optional area fill). */
export interface LineChartSeries {
  readonly name: string;
  readonly points: readonly LineChartPoint[];
}

/** Per-series render model: paths plus the cycled token color. */
interface LineSeriesView {
  readonly name: string;
  readonly color: string;
  readonly fill: string;
  readonly path: string;
  readonly areaPath: string;
  /** Scaled position of a single-point series' marker, else `null`. */
  readonly marker: { readonly x: number; readonly y: number } | null;
}

/** A positioned tick label on either axis. */
interface AxisTickView {
  readonly pos: number;
  readonly label: string;
}

/** Full render model produced once per input change. */
interface LineChartView {
  readonly series: readonly LineSeriesView[];
  readonly yTicks: readonly AxisTickView[];
  readonly xTicks: readonly AxisTickView[];
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/** Plot margins when axes (and their labels) are rendered. */
const AXES_MARGIN = { top: 12, right: 12, bottom: 28, left: 44 } as const;

/** Slim padding when the chart is a bare shape (no axes). */
const PLAIN_MARGIN = { top: 4, right: 4, bottom: 4, left: 4 } as const;

/** Most x tick labels rendered: first, last, and a few in between. */
const MAX_X_TICKS = 5;

/** Radius of the marker drawn for a single-point series. */
const POINT_RADIUS = 3;

/**
 * Dependency-free multi-series SVG line chart. Series are colored by
 * cycling the closed `--app-chart-1..6` palette; the optional area fill
 * is a translucent `color-mix()` of the same token (gradient-free).
 * The SVG fills the host (`width: 100%`) and uses the measured host
 * width as its viewBox width, so one SVG unit equals one CSS px and
 * text labels never stretch.
 *
 * ```html
 * <m3k-line-chart
 *   [series]="[{ name: 'Revenue', points: [{ x: 'Jan', y: 4200 }, ...] }]"
 *   [area]="true"
 *   ariaLabel="Revenue by month"
 * />
 * ```
 */
@Component({
  selector: 'm3k-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent {
  /** Series to plot; string/Date x values are supported (see docs). */
  readonly series = input.required<readonly LineChartSeries[]>();

  /** Fills under each line with a translucent tint of its series color. */
  readonly area = input<boolean>(false);

  /** Renders axis lines and tick labels. */
  readonly showAxes = input<boolean>(true);

  /** Renders hairline horizontal grid lines at the y ticks. */
  readonly showGrid = input<boolean>(true);

  /** Rendered height in px (also the viewBox height). */
  readonly height = input<number>(240);

  /** Accessible description of the chart (`role="img"`). */
  readonly ariaLabel = input<string>('Line chart');

  /** Optional override for the generated SVG `<desc>` text. */
  readonly ariaDescription = input<string | null>(null);

  protected readonly pointRadius = POINT_RADIUS;

  /** Host width in CSS px, doubling as the viewBox width. */
  private readonly hostWidth = injectHostWidth();

  protected readonly viewBox = computed<string>(
    () => `0 0 ${this.hostWidth()} ${this.height()}`,
  );

  protected readonly accessibleDescription = computed<string>(
    () => this.ariaDescription() ?? lineChartAccessibilitySummary(this.series()).description,
  );

  /** Render model, or `null` when there is nothing to plot. */
  protected readonly view = computed<LineChartView | null>(() => {
    const series = this.series().filter((s) => s.points.length > 0);
    if (series.length === 0) {
      return null;
    }

    const margin = this.showAxes() ? AXES_MARGIN : PLAIN_MARGIN;
    const left = margin.left;
    const right = this.hostWidth() - margin.right;
    const top = margin.top;
    const bottom = this.height() - margin.bottom;

    const xValues = series.flatMap((s) => s.points.map((point, i) => toXNumber(point.x, i)));
    const yValues = series.flatMap((s) => s.points.map((point) => point.y));
    const yTickValues = niceTicks(Math.min(...yValues), Math.max(...yValues));
    const yDomain: readonly [number, number] = [
      yTickValues[0],
      yTickValues[yTickValues.length - 1],
    ];
    const xScale = linearScale([Math.min(...xValues), Math.max(...xValues)], [left, right]);
    const yScale = linearScale(yDomain, [bottom, top]);
    const baselineY = yScale(yDomain[0]);

    const seriesViews = series.map((s, i): LineSeriesView => {
      const color = chartSeriesColor(i);
      const points = s.points.map((point, pi) => ({
        x: xScale(toXNumber(point.x, pi)),
        y: yScale(point.y),
      }));
      return {
        name: s.name,
        color,
        fill: `color-mix(in srgb, ${color} 20%, transparent)`,
        path: linePath(points),
        areaPath: areaPath(points, baselineY),
        // A one-point series draws no line; mark the lone point instead.
        marker:
          points.length === 1 ? { x: round2(points[0].x), y: round2(points[0].y) } : null,
      };
    });

    // X labels come from the densest series: first, last, a few between.
    const labelSource = series.reduce((a, b) => (b.points.length > a.points.length ? b : a));
    const xTicks = pickTickIndices(labelSource.points.length, MAX_X_TICKS).map(
      (index): AxisTickView => {
        const point = labelSource.points[index];
        return {
          pos: round2(xScale(toXNumber(point.x, index))),
          label: formatXLabel(point.x),
        };
      },
    );

    return {
      series: seriesViews,
      yTicks: yTickValues.map(
        (tick): AxisTickView => ({ pos: round2(yScale(tick)), label: String(tick) }),
      ),
      xTicks,
      left,
      right,
      top,
      bottom,
    };
  });
}

/** Numeric x for scaling: numbers as-is, Dates by epoch, strings by index. */
function toXNumber(x: LineChartX, index: number): number {
  if (typeof x === 'number') {
    return x;
  }
  if (x instanceof Date) {
    return x.getTime();
  }
  return index;
}

/** Human-readable x label for the original value. */
function formatXLabel(x: LineChartX): string {
  if (x instanceof Date) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(x);
  }
  return String(x);
}

/** Up to `count` point indices: first, last, and evenly spaced between. */
function pickTickIndices(pointCount: number, count: number): readonly number[] {
  if (pointCount <= 0) {
    return [];
  }
  if (pointCount === 1) {
    return [0];
  }
  const slots = Math.min(count, pointCount);
  const indices = new Set<number>();
  for (let i = 0; i < slots; i++) {
    indices.add(Math.round((i * (pointCount - 1)) / (slots - 1)));
  }
  return [...indices].sort((a, b) => a - b);
}
