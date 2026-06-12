import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import { SnackbarService } from './snackbar.service';

/**
 * Launcher host: snackbars are imperative overlays, so the story renders
 * one button per severity that calls `SnackbarService.show()` (same
 * pattern as the Atoms parity overlay stories).
 *
 * Severity panel colors come from the lib's global `snackbar.styles.scss`
 * sheet, imported by the Storybook theme aggregator — see the
 * Molecules/Overlays docs page.
 */
@Component({
  selector: 'm3k-snackbar-launcher',
  imports: [MatButtonModule],
  template: `
    <div class="launchers">
      <button mat-stroked-button type="button" (click)="info()">Info</button>
      <button mat-stroked-button type="button" (click)="success()">
        Success with action
      </button>
      <button mat-stroked-button type="button" (click)="warning()">
        Warning
      </button>
      <button mat-stroked-button type="button" (click)="error()">
        Error with retry
      </button>
      <p class="result" aria-live="polite">Last action: {{ lastAction }}</p>
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
class SnackbarLauncherComponent {
  private readonly snackbar = inject(SnackbarService);

  protected lastAction = '(none yet)';

  protected info(): void {
    this.snackbar.show('Monthly revenue report scheduled for 06:00');
    this.lastAction = 'showed info';
  }

  protected success(): void {
    this.snackbar
      .show('Invoice INV-2026-0042 marked as paid', {
        severity: 'success',
        action: 'View',
        durationMs: 6000,
      })
      .onAction()
      .subscribe(() => {
        this.lastAction = 'view clicked';
      });
    this.lastAction = 'showed success';
  }

  protected warning(): void {
    this.snackbar.show(
      'Import finished: 3 of 120 orders skipped (missing customer)',
      { severity: 'warning', durationMs: 8000 },
    );
    this.lastAction = 'showed warning';
  }

  protected error(): void {
    this.snackbar
      .show('Export failed: orders-2026-05.csv could not be written', {
        severity: 'error',
        action: 'Retry',
        durationMs: 8000,
      })
      .onAction()
      .subscribe(() => {
        this.lastAction = 'retry clicked';
      });
    this.lastAction = 'showed error';
  }
}

const meta: Meta<SnackbarLauncherComponent> = {
  component: SnackbarLauncherComponent,
  title: 'Molecules/Snackbar',
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
  parameters: {
    docs: {
      description: {
        component:
          'Launchers for `SnackbarService.show()` — one per severity ' +
          '(`info`, `success`, `warning`, `error`), each mapped to an ' +
          '`m3k-snack-<severity>` panel class. Full service documentation ' +
          'lives on the Molecules/Overlays docs page.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<SnackbarLauncherComponent>;

/** One launcher per severity. */
export const Severities: Story = {};
