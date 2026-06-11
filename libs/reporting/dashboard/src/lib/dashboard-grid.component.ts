import { ChangeDetectionStrategy, Component, Directive, computed, input } from '@angular/core';

/** Column span for a grid item; `'full'` stretches across the row. */
export type DashboardGridSpan = number | 'full';

/**
 * Marks a `rpt-dashboard-grid` child to span multiple columns.
 *
 * ```html
 * <rpt-detail-card rptGridSpan="2" ... />
 * <rpt-detail-card rptGridSpan="full" ... />
 * ```
 */
@Directive({
  selector: '[rptGridSpan]',
  host: {
    '[style.grid-column]': 'gridColumn()',
  },
})
export class GridSpanDirective {
  /** Number of columns to span, or `'full'` for the whole row. */
  readonly rptGridSpan = input.required<DashboardGridSpan>();

  protected readonly gridColumn = computed<string>(() => {
    const span = this.rptGridSpan();
    return span === 'full' ? '1 / -1' : `span ${span}`;
  });
}

/**
 * Responsive, dependency-free dashboard grid: columns auto-fill with a
 * configurable minimum width and any direct child can span columns via
 * the {@link GridSpanDirective} (`rptGridSpan`).
 *
 * ```html
 * <rpt-dashboard-grid minColumnWidth="14rem" gap="1.5rem">
 *   <rpt-kpi-card ... />
 *   <rpt-detail-card rptGridSpan="2" ... />
 * </rpt-dashboard-grid>
 * ```
 */
@Component({
  selector: 'rpt-dashboard-grid',
  template: '<ng-content />',
  styleUrl: './dashboard-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--rpt-dashboard-grid-min-column-width]': 'minColumnWidth()',
    '[style.gap]': 'gap()',
  },
})
export class DashboardGridComponent {
  /** Minimum column width fed into the auto-fill `minmax()` track. */
  readonly minColumnWidth = input<string>('16rem');

  /** Gap between grid cells. */
  readonly gap = input<string>('1rem');
}
