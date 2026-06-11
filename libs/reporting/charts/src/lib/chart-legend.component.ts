import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { chartSeriesColor } from './internal/scale';

/** One legend row; `colorIndex` is the zero-based series index. */
export interface ChartLegendItem {
  readonly label: string;
  /** Zero-based series index, cycled onto `--app-chart-1..6`. */
  readonly colorIndex: number;
}

/**
 * Wrapping swatch-and-label legend for the chart components. Swatches
 * cycle the closed `--app-chart-1..6` palette by zero-based series
 * index — pass the same indices the chart used so colors line up.
 *
 * ```html
 * <rpt-chart-legend
 *   [items]="[
 *     { label: 'Paid', colorIndex: 0 },
 *     { label: 'Overdue', colorIndex: 1 },
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'rpt-chart-legend',
  template: `
    <ul class="rpt-chart-legend">
      @for (item of items(); track $index) {
        <li class="rpt-chart-legend__item">
          <span
            class="rpt-chart-legend__swatch"
            [style.background]="swatchColor(item.colorIndex)"
            aria-hidden="true"
          ></span>
          <span class="rpt-chart-legend__label">{{ item.label }}</span>
        </li>
      }
    </ul>
  `,
  styleUrl: './chart-legend.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartLegendComponent {
  /** Legend rows in series order. */
  readonly items = input.required<readonly ChartLegendItem[]>();

  protected swatchColor(colorIndex: number): string {
    return chartSeriesColor(colorIndex);
  }
}
