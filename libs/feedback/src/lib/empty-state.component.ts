import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Centered presentational block for no-data surfaces: an icon in a tonal
 * circle, a title, an optional description, and a content-projection slot
 * for actions.
 *
 * ```html
 * <m3k-empty-state
 *   icon="receipt_long"
 *   title="No invoices yet"
 *   description="Invoices you issue will appear here."
 * >
 *   <button m3kEmptyStateActions mat-stroked-button>New invoice</button>
 * </m3k-empty-state>
 * ```
 */
@Component({
  selector: 'm3k-empty-state',
  imports: [MatIconModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  /** Material Symbols icon name shown in the tonal circle. */
  readonly icon = input('inbox');

  /** Short headline stating what is empty. */
  readonly title = input.required<string>();

  /** Optional secondary line explaining why, or what to do next. */
  readonly description = input<string | null>(null);
}
