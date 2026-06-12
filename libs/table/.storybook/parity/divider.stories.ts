import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

/** Parity gallery: raw Angular Material dividers (no m3kit wrapper). */
const LAYOUT = `
  .parity-section { margin-block-end: 28px; max-inline-size: 480px; }
  .parity-section h3 {
    font: var(--mat-sys-title-small);
    color: var(--mat-sys-on-surface-variant);
    margin: 0 0 12px;
  }
  .parity-card {
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: var(--app-radius-card);
    background: var(--mat-sys-surface);
    overflow: hidden;
  }
  .parity-block {
    padding: 16px;
    font: var(--mat-sys-body-medium);
    color: var(--mat-sys-on-surface);
  }
  .parity-block strong {
    display: block;
    font: var(--mat-sys-title-small);
    margin-block-end: 4px;
  }
  .parity-vertical {
    display: flex;
    align-items: stretch;
    gap: 16px;
    padding: 16px;
    min-block-size: 72px;
  }
  .parity-vertical p {
    margin: 0;
    font: var(--mat-sys-body-medium);
    color: var(--mat-sys-on-surface);
  }
`;

const meta: Meta = {
  title: 'Material Parity/Divider',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatDividerModule, MatListModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Between content blocks</h3>
        <div class="parity-card">
          <div class="parity-block">
            <strong>Q2 revenue summary</strong>
            Invoiced $482,910 across 1,204 orders.
          </div>
          <mat-divider></mat-divider>
          <div class="parity-block">
            <strong>Outstanding</strong>
            38 invoices overdue totalling $52,114.
          </div>
        </div>
      </section>
      <section class="parity-section">
        <h3>Inset dividers in a list</h3>
        <div class="parity-card">
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>INV-1042 — Acme Industrial</span>
              <span matListItemLine>$12,400 · sent 4 days ago</span>
            </mat-list-item>
            <mat-divider inset></mat-divider>
            <mat-list-item>
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>INV-1043 — Borealis Labs</span>
              <span matListItemLine>$3,150 · paid</span>
            </mat-list-item>
            <mat-divider inset></mat-divider>
            <mat-list-item>
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>INV-1044 — Cascade Outfitters</span>
              <span matListItemLine>$890 · overdue 12 days</span>
            </mat-list-item>
          </mat-list>
        </div>
      </section>
      <section class="parity-section">
        <h3>Vertical</h3>
        <div class="parity-card parity-vertical">
          <p>1,204 orders</p>
          <mat-divider vertical></mat-divider>
          <p>312 customers</p>
          <mat-divider vertical></mat-divider>
          <p>47 open tickets</p>
        </div>
      </section>
    `,
  }),
};
