import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Parity gallery: raw Angular Material badges (no m3kit wrapper). */
const LAYOUT = `
  .parity-section { margin-block-end: 28px; }
  .parity-section h3 {
    font: var(--mat-sys-title-small);
    color: var(--mat-sys-on-surface-variant);
    margin: 0 0 12px;
  }
  .parity-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 28px;
  }
  .parity-row mat-icon { color: var(--mat-sys-on-surface-variant); }
`;

const meta: Meta = {
  title: 'Atoms/Badge',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatBadgeModule, MatButtonModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Counts on icons</h3>
        <div class="parity-row">
          <mat-icon matBadge="3" aria-hidden="false" aria-label="Notifications, 3 unread">
            notifications
          </mat-icon>
          <mat-icon matBadge="12" aria-hidden="false" aria-label="Inbox, 12 unread">
            mail
          </mat-icon>
          <mat-icon matBadge="99+" aria-hidden="false" aria-label="Support tickets, over 99 open">
            support_agent
          </mat-icon>
        </div>
      </section>
      <section class="parity-section">
        <h3>Colors</h3>
        <div class="parity-row">
          <mat-icon matBadge="5" matBadgeColor="primary" aria-hidden="false" aria-label="Orders, 5 new">
            shopping_cart
          </mat-icon>
          <mat-icon matBadge="2" matBadgeColor="accent" aria-hidden="false" aria-label="Drafts, 2 pending">
            drafts
          </mat-icon>
          <mat-icon matBadge="8" matBadgeColor="warn" aria-hidden="false" aria-label="Overdue invoices, 8">
            warning
          </mat-icon>
        </div>
      </section>
      <section class="parity-section">
        <h3>Sizes and position</h3>
        <div class="parity-row">
          <mat-icon matBadge="1" matBadgeSize="small" aria-hidden="false" aria-label="One alert">
            notifications
          </mat-icon>
          <mat-icon matBadge="4" matBadgeSize="medium" aria-hidden="false" aria-label="Four alerts">
            notifications
          </mat-icon>
          <mat-icon matBadge="7" matBadgeSize="large" aria-hidden="false" aria-label="Seven alerts">
            notifications
          </mat-icon>
          <mat-icon matBadge="6" matBadgePosition="below before" aria-hidden="false" aria-label="Six comments">
            chat_bubble
          </mat-icon>
          <mat-icon matBadge="0" [matBadgeHidden]="true" aria-hidden="false" aria-label="No new messages">
            mail
          </mat-icon>
        </div>
      </section>
      <section class="parity-section">
        <h3>On buttons and text</h3>
        <div class="parity-row">
          <button mat-stroked-button type="button" matBadge="4" matBadgeOverlap="false">
            Open tickets
          </button>
          <button mat-flat-button type="button" matBadge="2" matBadgeOverlap="false">
            Pending approvals
          </button>
          <span matBadge="17" matBadgeOverlap="false">Unreconciled invoices</span>
        </div>
      </section>
    `,
  }),
};
