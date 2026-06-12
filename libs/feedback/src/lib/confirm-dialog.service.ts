import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
} from './confirm-dialog.component';

/**
 * Imperative confirmation prompts over `MatDialog`.
 *
 * ```ts
 * private readonly confirm = inject(ConfirmDialogService);
 *
 * voidInvoice(): void {
 *   this.confirm
 *     .open({
 *       title: 'Void invoice INV-2026-0017?',
 *       message: 'Voiding removes the invoice from receivables.',
 *       confirmLabel: 'Void invoice',
 *       destructive: true,
 *     })
 *     .subscribe((confirmed) => { if (confirmed) { ... } });
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Opens an `m3k-confirm-dialog` and resolves the user's choice.
   *
   * Emits exactly once when the dialog closes: `true` only when the
   * confirm button was pressed; cancel, Escape, and backdrop dismissal
   * all map to `false`.
   */
  open(config: ConfirmDialogConfig): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(
        ConfirmDialogComponent,
        {
          data: config,
          role: 'alertdialog',
          maxWidth: '28rem',
        },
      )
      .afterClosed()
      .pipe(map((result) => result === true));
  }
}
