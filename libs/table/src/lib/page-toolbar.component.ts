import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Header toolbar for a report view: title, optional row count, and a
 * content-projection slot for action buttons (export, refresh, ...).
 *
 * ```html
 * <m3k-page-toolbar [title]="def.title" [rowCount]="table.totalCount()">
 *   <button mat-stroked-button>Export</button>
 * </m3k-page-toolbar>
 * ```
 */
@Component({
  selector: 'm3k-page-toolbar',
  imports: [MatToolbarModule],
  templateUrl: './page-toolbar.component.html',
  styleUrl: './page-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageToolbarComponent {
  /** Page title shown at the start of the toolbar. */
  readonly title = input.required<string>();

  /** Optional row count chip; hidden when `null`. */
  readonly rowCount = input<number | null>(null);
}
