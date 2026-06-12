import { inject, Injectable } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';

/** Severity register for {@link SnackbarService.show}. */
export type SnackbarSeverity = 'info' | 'success' | 'warning' | 'error';

/** Options for {@link SnackbarService.show}. */
export interface SnackbarOptions {
  /** Visual/semantic register. Defaults to `'info'`. */
  readonly severity?: SnackbarSeverity;
  /** Optional action button label (e.g. `'Undo'`, `'Retry'`). */
  readonly action?: string;
  /** Auto-dismiss delay in milliseconds. Defaults to 4000. */
  readonly durationMs?: number;
}

/** Default auto-dismiss delay, in milliseconds. */
const DEFAULT_DURATION_MS = 4000;

/**
 * Severity-aware transient notifications over `MatSnackBar`.
 *
 * Each severity maps to an `m3k-snack-<severity>` panel class whose colors
 * ship with the lib in `snackbar.styles.scss` (a global stylesheet —
 * snackbars render in the CDK overlay container, outside component
 * encapsulation — imported once by the app's theme aggregator; see the
 * Overlays docs page). Colors resolve through the `--app-severity-*`
 * contract with M3 system-token fallbacks, so they retheme per brand.
 *
 * ```ts
 * private readonly snackbar = inject(SnackbarService);
 *
 * this.snackbar.show('Invoice INV-2026-0042 marked as paid', {
 *   severity: 'success',
 *   action: 'View',
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Shows a snackbar and returns the underlying `MatSnackBarRef`
   * (subscribe to `onAction()` for the action button).
   */
  show(
    message: string,
    options: SnackbarOptions = {},
  ): MatSnackBarRef<TextOnlySnackBar> {
    const severity: SnackbarSeverity = options.severity ?? 'info';
    return this.snackBar.open(message, options.action, {
      duration: options.durationMs ?? DEFAULT_DURATION_MS,
      panelClass: `m3k-snack-${severity}`,
    });
  }
}
