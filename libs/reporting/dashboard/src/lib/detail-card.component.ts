import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/** One label/value line in a `rpt-detail-card`. */
export interface DetailCardRow {
  readonly label: string;
  readonly value: string | number;
}

/**
 * Titled card listing label/value rows, with content-projection slots
 * for header actions and a footer.
 *
 * ```html
 * <rpt-detail-card title="Latest invoice" subtitle="INV-2026-0042" [rows]="rows">
 *   <button rptDetailCardActions mat-icon-button>...</button>
 *   <a rptDetailCardFooter mat-button>View all invoices</a>
 * </rpt-detail-card>
 * ```
 */
@Component({
  selector: 'rpt-detail-card',
  imports: [MatCardModule],
  templateUrl: './detail-card.component.html',
  styleUrl: './detail-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailCardComponent {
  /** Card title. */
  readonly title = input.required<string>();

  /** Optional subtitle under the title. */
  readonly subtitle = input<string | null>(null);

  /** Label/value rows; an empty list renders a placeholder message. */
  readonly rows = input.required<readonly DetailCardRow[]>();
}
