import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Header toolbar for a report view: title, optional row count, and a
 * content-projection slot for action buttons (export, refresh, ...).
 *
 * ```html
 * <rpt-report-toolbar [title]="def.title" [rowCount]="table.totalCount()">
 *   <button mat-stroked-button>Export</button>
 * </rpt-report-toolbar>
 * ```
 */
@Component({
  selector: 'rpt-report-toolbar',
  imports: [MatToolbarModule],
  templateUrl: './report-toolbar.component.html',
  styleUrl: './report-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportToolbarComponent {
  /** Report title shown at the start of the toolbar. */
  readonly title = input.required<string>();

  /** Optional row count chip; hidden when `null`. */
  readonly rowCount = input<number | null>(null);
}
