import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Visual + semantic weight of a `m3k-banner`. */
export type BannerSeverity = 'info' | 'success' | 'warning' | 'error';

/** Leading Material Symbol per severity. */
const SEVERITY_ICONS: Record<BannerSeverity, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

/**
 * Inline alert strip: a leading severity icon, projected message content,
 * an optional projected action slot, and an optional trailing dismiss
 * button. Flat (no shadow), severity-tinted via the `--app-severity-*`
 * contract tokens with M3 system-pair fallbacks.
 *
 * Info and success render with `role="status"` (polite); warning and
 * error render with `role="alert"` (assertive).
 *
 * ```html
 * <m3k-banner severity="warning" [dismissible]="true" (dismissed)="onDismiss()">
 *   3 invoices are overdue.
 *   <button m3kBannerAction mat-button>Review</button>
 * </m3k-banner>
 * ```
 */
@Component({
  selector: 'm3k-banner',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerComponent {
  /** Severity; drives color pair, leading icon, and ARIA role. */
  readonly severity = input<BannerSeverity>('info');

  /** When true, renders a trailing dismiss icon-button. */
  readonly dismissible = input<boolean>(false);

  /** Emits when the dismiss button is clicked; the host removes the banner. */
  readonly dismissed = output<void>();

  /** Leading icon name for the current severity. */
  protected readonly icon = computed(() => SEVERITY_ICONS[this.severity()]);

  /** `alert` for warning/error, `status` for info/success. */
  protected readonly role = computed(() =>
    this.severity() === 'warning' || this.severity() === 'error' ? 'alert' : 'status',
  );
}
