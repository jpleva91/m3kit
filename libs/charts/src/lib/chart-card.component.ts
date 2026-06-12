import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Titled mat-card frame for a projected chart, with an optional legend
 * slot and loading / empty states. The title renders in the brand
 * display family; the card takes the brand's card radius.
 *
 * ```html
 * <m3k-chart-card title="Revenue" subtitle="Last 6 months" [loading]="loading()">
 *   <m3k-line-chart [series]="series()" />
 *   <m3k-chart-legend m3kChartCardLegend [items]="legend()" />
 * </m3k-chart-card>
 * ```
 */
@Component({
  selector: 'm3k-chart-card',
  imports: [MatCardModule, MatProgressBarModule],
  templateUrl: './chart-card.component.html',
  styleUrl: './chart-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCardComponent {
  /** Card title (rendered as an `h2` in the brand display face). */
  readonly title = input.required<string>();

  /** Optional subtitle under the title. */
  readonly subtitle = input<string | null>(null);

  /** Replaces the chart with an indeterminate progress bar. */
  readonly loading = input<boolean>(false);

  /** Replaces the chart with the empty message (ignored while loading). */
  readonly empty = input<boolean>(false);

  /** Message shown in the empty state. */
  readonly emptyMessage = input<string>('No data to display.');
}
