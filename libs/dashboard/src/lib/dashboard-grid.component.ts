import { ChangeDetectionStrategy, Component, Directive, computed, input } from '@angular/core';

/** Column span for a grid item; `'full'` stretches across the row. */
export type DashboardGridSpan = number | 'full';

/**
 * Marks a `m3k-dashboard-grid` child to span multiple columns.
 *
 * ```html
 * <m3k-detail-card m3kGridSpan="2" ... />
 * <m3k-detail-card m3kGridSpan="full" ... />
 * ```
 */
@Directive({
  selector: '[m3kGridSpan]',
  host: {
    '[style.grid-column]': 'gridColumn()',
  },
})
export class GridSpanDirective {
  /** Number of columns to span, or `'full'` for the whole row. */
  readonly m3kGridSpan = input.required<DashboardGridSpan>();

  protected readonly gridColumn = computed<string>(() => {
    const span = this.m3kGridSpan();
    return span === 'full' ? '1 / -1' : `span ${span}`;
  });
}

/**
 * Responsive, dependency-free dashboard grid: columns auto-fill with a
 * configurable minimum width and any direct child can span columns via
 * the {@link GridSpanDirective} (`m3kGridSpan`).
 *
 * ```html
 * <m3k-dashboard-grid minColumnWidth="14rem" gap="1.5rem">
 *   <m3k-kpi-card ... />
 *   <m3k-detail-card m3kGridSpan="2" ... />
 * </m3k-dashboard-grid>
 * ```
 */
@Component({
  selector: 'm3k-dashboard-grid',
  template: '<ng-content />',
  styleUrl: './dashboard-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--m3k-dashboard-grid-min-column-width]': 'minColumnWidth()',
    '[style.gap]': 'gap()',
  },
})
export class DashboardGridComponent {
  /** Minimum column width fed into the auto-fill `minmax()` track. */
  readonly minColumnWidth = input<string>('16rem');

  /** Gap between grid cells. */
  readonly gap = input<string>('1rem');
}
