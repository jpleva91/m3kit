import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

/** Typed payload for `ConfirmDialogService.open()`. */
export interface ConfirmDialogConfig {
  /** Dialog title (rendered as the dialog heading). */
  readonly title: string;
  /** Body message under the title. */
  readonly message: string;
  /** Confirm button label. Defaults to `'Confirm'`. */
  readonly confirmLabel?: string;
  /** Cancel button label. Defaults to `'Cancel'`. */
  readonly cancelLabel?: string;
  /**
   * Marks the action as irreversible: the confirm button renders filled
   * with the M3 error role instead of primary.
   */
  readonly destructive?: boolean;
}

/**
 * Internal dialog body for {@link ConfirmDialogService}: title, message,
 * and a cancel/confirm button row.
 *
 * Not meant to be embedded in templates — open it through the service,
 * which returns the user's choice as `Observable<boolean>`. It is exported
 * (and covered by spec/story/cy artifacts) so adopters can restyle or
 * test it directly.
 */
@Component({
  selector: 'm3k-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly config = inject<ConfirmDialogConfig>(MAT_DIALOG_DATA);

  private readonly dialogRef =
    inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);

  protected get confirmLabel(): string {
    return this.config.confirmLabel ?? 'Confirm';
  }

  protected get cancelLabel(): string {
    return this.config.cancelLabel ?? 'Cancel';
  }

  protected close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
