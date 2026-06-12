import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

/**
 * Parity gallery: raw Angular Material cards (no m3kit wrappers), proving the
 * brand token system styles both card appearances without component CSS.
 */
@Component({
  selector: 'parity-card-demo',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parity-row">
      <mat-card appearance="raised">
        <mat-card-header>
          <div mat-card-avatar class="parity-avatar">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <mat-card-title>Invoice INV-0042</mat-card-title>
          <mat-card-subtitle>Acme Corp — issued Mar 14, 2026</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>
            Quarterly services retainer covering onboarding, support hours and
            the analytics add-on. Net 30 terms; reminder scheduled for Apr 7.
          </p>
          <mat-chip-set>
            <mat-chip>Net 30</mat-chip>
            <mat-chip>USD 4,820.00</mat-chip>
            <mat-chip>Sent</mat-chip>
          </mat-chip-set>
        </mat-card-content>
        <mat-divider></mat-divider>
        <mat-card-actions align="end">
          <button mat-button>Void</button>
          <button mat-flat-button>Record payment</button>
        </mat-card-actions>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header>
          <div mat-card-avatar class="parity-avatar">
            <mat-icon>support_agent</mat-icon>
          </div>
          <mat-card-title>Ticket #5817</mat-card-title>
          <mat-card-subtitle>Export job stuck at 80%</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>
            Customer reports the nightly order export hangs after the products
            sheet. Logs attached; reproduced on the staging dataset.
          </p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button>Assign</button>
          <button mat-button>Escalate</button>
          <button mat-button disabled>Merge</button>
        </mat-card-actions>
        <mat-card-footer>
          <p class="parity-footer-note">Updated 12 minutes ago</p>
        </mat-card-footer>
      </mat-card>

      <mat-card appearance="outlined" class="parity-compact">
        <mat-card-content>
          <p>
            Content-only outlined card: 1,284 active customers this month, up
            6.2% over February.
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .parity-row {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: flex-start;
        padding: 16px;
      }
      mat-card {
        width: 340px;
      }
      .parity-compact {
        width: 240px;
      }
      .parity-avatar {
        display: grid;
        place-items: center;
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }
      .parity-footer-note {
        margin: 0;
        padding: 0 16px 16px;
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
      }
      mat-card-content p {
        margin-top: 0;
      }
    `,
  ],
})
class ParityCardDemoComponent {}

const meta: Meta<ParityCardDemoComponent> = {
  component: ParityCardDemoComponent,
  title: 'Atoms/Card',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityCardDemoComponent>;

export const Variants: Story = {};
