import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

/**
 * Plain Angular Material `MatSnackBar` launchers (no m3kit wrapper) covering
 * the common variants: plain confirmation, message with action, long
 * multi-line text, and a top-positioned persistent bar with Dismiss.
 */
@Component({
  selector: 'parity-snackbar-launcher',
  standalone: true,
  imports: [MatButtonModule, MatSnackBarModule],
  template: `
    <div class="parity-launchers">
      <button mat-flat-button (click)="confirmation()">Saved confirmation</button>
      <button mat-stroked-button (click)="withAction()">Delete with Undo</button>
      <button mat-stroked-button (click)="longMessage()">Long sync warning</button>
      <button mat-button (click)="persistentTop()">Persistent (top)</button>
      <p class="parity-result">Last action: {{ lastAction }}</p>
    </div>
  `,
  styles: [
    `
      .parity-launchers {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .parity-result {
        margin: 0;
        font: var(--mat-sys-body-small);
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
class ParitySnackbarLauncherComponent {
  lastAction = '(none yet)';

  constructor(private readonly snackBar: MatSnackBar) {}

  confirmation(): void {
    this.snackBar.open('Invoice INV-0042 saved', undefined, { duration: 3000 });
    this.lastAction = 'opened confirmation';
  }

  withAction(): void {
    this.snackBar
      .open('Order ORD-1017 deleted', 'Undo', { duration: 6000 })
      .onAction()
      .subscribe(() => {
        this.lastAction = 'undo clicked';
      });
    this.lastAction = 'opened delete with undo';
  }

  longMessage(): void {
    this.snackBar.open(
      'Sync finished with 3 warnings: 2 customers were skipped because of ' +
        'duplicate emails, and 1 product had no price in the source file.',
      'View log',
      { duration: 8000 }
    );
    this.lastAction = 'opened long warning';
  }

  persistentTop(): void {
    this.snackBar.open('You are viewing archived 2025 data', 'Dismiss', {
      verticalPosition: 'top',
    });
    this.lastAction = 'opened persistent top bar';
  }
}

const meta: Meta<ParitySnackbarLauncherComponent> = {
  component: ParitySnackbarLauncherComponent,
  title: 'Material Parity/Snackbar',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParitySnackbarLauncherComponent>;

export const Variants: Story = {};
