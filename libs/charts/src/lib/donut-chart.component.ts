import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  CHART_SERIES_TOKEN_COUNT,
  chartSeriesColor,
  donutSegments,
  round2,
} from './internal/scale';

/** One donut slice; `colorToken` pins a 1-based `--app-chart-N` slot. */
export interface DonutChartSlice {
  readonly label: string;
  readonly value: number;
  /** Optional explicit token slot (1..6); defaults to cycling by index. */
  readonly colorToken?: number;
}

/** Per-slice render model: dash geometry plus the resolved token color. */
interface DonutSliceView {
  readonly label: string;
  readonly color: string;
  readonly dashArray: string;
  readonly dashOffset: number;
}

/** Square viewBox edge; the circle never distorts (aspect preserved). */
const VIEWBOX_SIZE = 200;

/** Ring radius and thickness inside the 200×200 viewBox. */
const RING_RADIUS = 70;
const RING_WIDTH = 28;

/**
 * Dependency-free SVG donut chart drawn with the stroke-dasharray
 * circle technique (`pathLength="100"`, so dash values are exact
 * percentages). Slice colors cycle the closed `--app-chart-1..6`
 * palette unless a slice pins a `colorToken`. Optional center text:
 * the value renders in the brand display face.
 *
 * ```html
 * <m3k-donut-chart
 *   [slices]="[{ label: 'Paid', value: 96 }, { label: 'Overdue', value: 14 }]"
 *   centerLabel="Invoices"
 *   centerValue="110"
 * />
 * ```
 */
@Component({
  selector: 'm3k-donut-chart',
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent {
  /** Slices in display order, clockwise from 12 o'clock. */
  readonly slices = input.required<readonly DonutChartSlice[]>();

  /** Small caption under the center value. */
  readonly centerLabel = input<string | null>(null);

  /** Headline figure in the donut hole (brand display face). */
  readonly centerValue = input<string | null>(null);

  /** Rendered height in px; the square donut scales to fit. */
  readonly height = input<number>(240);

  /** Accessible description of the chart (`role="img"`). */
  readonly ariaLabel = input<string>('Donut chart');

  protected readonly viewBox = `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`;
  protected readonly center = VIEWBOX_SIZE / 2;
  protected readonly radius = RING_RADIUS;
  protected readonly ringWidth = RING_WIDTH;

  /** Slices resolved into dash geometry; zero-value slices are dropped. */
  protected readonly sliceViews = computed<readonly DonutSliceView[]>(() => {
    const slices = this.slices();
    const segments = donutSegments(slices.map((slice) => slice.value));
    return slices
      .map((slice, i): DonutSliceView => {
        const percent = round2(segments[i].fraction * 100);
        return {
          label: slice.label,
          color:
            slice.colorToken != null
              ? `var(--app-chart-${clampToken(slice.colorToken)})`
              : chartSeriesColor(i),
          dashArray: `${percent} ${round2(100 - percent)}`,
          dashOffset: round2(-segments[i].start * 100),
        };
      })
      .filter((view) => view.dashArray !== '0 100');
  });

  /** Vertical anchor for the center value: nudged up to fit the label. */
  protected readonly centerValueY = computed<number>(() =>
    this.centerLabel() === null ? this.center + 9 : this.center - 2,
  );
}

/** Folds an explicit token slot into the closed 1..6 palette. */
function clampToken(token: number): number {
  const index = Math.trunc(token) - 1;
  return ((index % CHART_SERIES_TOKEN_COUNT) + CHART_SERIES_TOKEN_COUNT) %
    CHART_SERIES_TOKEN_COUNT + 1;
}
