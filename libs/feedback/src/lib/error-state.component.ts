import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Centered presentational block for failed surfaces — the error-register
 * sibling of `m3k-empty-state`. Renders an icon in an error-tonal circle, a
 * title, an optional description, an optional collapsed technical-details
 * disclosure, and a default "Try again" stroked button that emits `retry`.
 * Projecting content into the `[m3kErrorStateActions]` slot replaces the
 * default button.
 *
 * ```html
 * <m3k-error-state
 *   title="Could not load invoices"
 *   description="The invoice list did not respond."
 *   [details]="errorDetails"
 *   (retry)="reload()"
 * />
 * ```
 */
@Component({
  selector: 'm3k-error-state',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  /** Material Symbols icon name shown in the error-tonal circle. */
  readonly icon = input('error');

  /** Short headline stating what failed. */
  readonly title = input.required<string>();

  /** Optional secondary line explaining the failure in plain language. */
  readonly description = input<string | null>(null);

  /**
   * Optional technical message (error code, response body, stack excerpt),
   * rendered collapsed behind a "Technical details" disclosure in the
   * data/mono face.
   */
  readonly details = input<string | null>(null);

  /** Emits when the default "Try again" button is pressed. */
  readonly retry = output<void>();
}
