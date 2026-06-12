import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import { ConfirmDialogService } from './confirm-dialog.service';

/**
 * Launcher host: dialogs are imperative overlays, so the story renders
 * buttons that call `ConfirmDialogService.open()` and reports the
 * resolved boolean (same pattern as the Atoms parity overlay stories).
 */
@Component({
  selector: 'm3k-confirm-dialog-launcher',
  imports: [MatButtonModule],
  template: `
    <div class="launchers">
      <button mat-flat-button type="button" (click)="sendInvoice()">
        Send invoice INV-2026-0042
      </button>
      <button mat-stroked-button type="button" (click)="voidInvoice()">
        Void invoice INV-2026-0017 (destructive)
      </button>
      <p class="result" aria-live="polite">Last result: {{ lastResult }}</p>
    </div>
  `,
  styles: [
    `
      .launchers {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .result {
        margin: 0;
        font: var(--mat-sys-body-small);
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
class ConfirmDialogLauncherComponent {
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected lastResult = '(none yet)';

  protected sendInvoice(): void {
    this.confirmDialog
      .open({
        title: 'Send invoice INV-2026-0042?',
        message:
          'The invoice will be emailed to Cascade Outfitters and marked as sent.',
        confirmLabel: 'Send invoice',
      })
      .subscribe((confirmed) => {
        this.lastResult = confirmed ? 'sent' : 'kept as draft';
      });
  }

  protected voidInvoice(): void {
    this.confirmDialog
      .open({
        title: 'Void invoice INV-2026-0017?',
        message:
          'Voiding removes the invoice from receivables and cannot be undone.',
        confirmLabel: 'Void invoice',
        cancelLabel: 'Keep invoice',
        destructive: true,
      })
      .subscribe((confirmed) => {
        this.lastResult = confirmed ? 'voided' : 'kept';
      });
  }
}

const meta: Meta<ConfirmDialogLauncherComponent> = {
  component: ConfirmDialogLauncherComponent,
  title: 'Molecules/ConfirmDialog',
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
  parameters: {
    docs: {
      description: {
        component:
          'Launchers for `ConfirmDialogService.open()` — a default ' +
          '(primary confirm) prompt and a destructive (error-role confirm) ' +
          'prompt. Full service documentation lives on the ' +
          'Molecules/Overlays docs page.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<ConfirmDialogLauncherComponent>;

/** Default and destructive postures behind one launcher host. */
export const Launchers: Story = {};
