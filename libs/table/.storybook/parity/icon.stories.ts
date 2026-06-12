import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';

/** Parity gallery: raw Angular Material icons (Material Icons ligature font). */
const LAYOUT = `
  .parity-section { margin-block-end: 28px; }
  .parity-section h3 {
    font: var(--mat-sys-title-small);
    color: var(--mat-sys-on-surface-variant);
    margin: 0 0 12px;
  }
  .parity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
    max-inline-size: 720px;
  }
  .parity-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: var(--app-radius-card);
    color: var(--mat-sys-on-surface);
  }
  .parity-cell figcaption {
    font: var(--mat-sys-label-small);
    color: var(--mat-sys-on-surface-variant);
  }
  .parity-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }
  .tone-primary { color: var(--mat-sys-primary); }
  .tone-secondary { color: var(--mat-sys-secondary); }
  .tone-tertiary { color: var(--mat-sys-tertiary); }
  .tone-error { color: var(--mat-sys-error); }
  .tone-muted { color: var(--mat-sys-on-surface-variant); }
  .parity-inline {
    font: var(--mat-sys-body-medium);
    color: var(--mat-sys-on-surface);
    max-inline-size: 48ch;
  }
`;

const meta: Meta = {
  title: 'Atoms/Icon',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj;

const ICONS = [
  'dashboard',
  'table_chart',
  'receipt_long',
  'group',
  'shopping_cart',
  'support_agent',
  'inventory_2',
  'trending_up',
  'filter_list',
  'search',
  'settings',
  'download',
] as const;

export const Gallery: Story = {
  render: () => ({
    props: { icons: ICONS },
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Reporting icon set</h3>
        <div class="parity-grid">
          @for (name of icons; track name) {
            <figure class="parity-cell">
              <mat-icon>{{ name }}</mat-icon>
              <figcaption>{{ name }}</figcaption>
            </figure>
          }
        </div>
      </section>
      <section class="parity-section">
        <h3>System color roles</h3>
        <div class="parity-row">
          <mat-icon class="tone-primary">check_circle</mat-icon>
          <mat-icon class="tone-secondary">schedule</mat-icon>
          <mat-icon class="tone-tertiary">insights</mat-icon>
          <mat-icon class="tone-error">error</mat-icon>
          <mat-icon class="tone-muted">visibility_off</mat-icon>
        </div>
      </section>
      <section class="parity-section">
        <h3>Inline with text</h3>
        <p class="parity-inline">
          Orders marked <mat-icon inline>check_circle</mat-icon> paid are excluded
          from the overdue report; click <mat-icon inline>filter_list</mat-icon>
          in the toolbar to adjust the date range.
        </p>
      </section>
    `,
  }),
};
