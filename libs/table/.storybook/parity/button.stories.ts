import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Parity gallery: raw Angular Material buttons (no m3kit wrapper) proving the
 * brand token system styles every variant. Note: Angular Material 19 ships
 * text / elevated / filled / outlined; the M3 "tonal" variant arrives with
 * Material 20 (`matButton="tonal"`), so the tonal row shows the closest v19
 * equivalent (filled) under a tonal-labelled section.
 */
const LAYOUT = `
  .parity-section { margin-block-end: 24px; }
  .parity-section h3 {
    font: var(--mat-sys-title-small);
    color: var(--mat-sys-on-surface-variant);
    margin: 0 0 8px;
  }
  .parity-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
`;

const meta: Meta = {
  title: 'Material Parity/Button',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatButtonModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Filled</h3>
        <div class="parity-row">
          <button mat-flat-button type="button">Save invoice</button>
          <button mat-flat-button type="button">
            <mat-icon>send</mat-icon>
            Send to customer
          </button>
          <button mat-flat-button type="button" disabled>Save invoice</button>
        </div>
      </section>
      <section class="parity-section">
        <h3>Tonal (Material 19: nearest equivalent — filled; native tonal lands in Material 20)</h3>
        <div class="parity-row">
          <button mat-flat-button type="button">Duplicate order</button>
          <button mat-flat-button type="button" disabled>Duplicate order</button>
        </div>
      </section>
      <section class="parity-section">
        <h3>Elevated</h3>
        <div class="parity-row">
          <button mat-raised-button type="button">Export CSV</button>
          <button mat-raised-button type="button" disabled>Export CSV</button>
        </div>
      </section>
      <section class="parity-section">
        <h3>Outlined</h3>
        <div class="parity-row">
          <button mat-stroked-button type="button">Cancel</button>
          <button mat-stroked-button type="button">
            <mat-icon>filter_list</mat-icon>
            Filters
          </button>
          <button mat-stroked-button type="button" disabled>Cancel</button>
        </div>
      </section>
      <section class="parity-section">
        <h3>Text</h3>
        <div class="parity-row">
          <button mat-button type="button">View details</button>
          <button mat-button type="button">
            <mat-icon>history</mat-icon>
            Audit log
          </button>
          <button mat-button type="button" disabled>View details</button>
        </div>
      </section>
    `,
  }),
};

export const IconButtons: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Icon buttons</h3>
        <div class="parity-row">
          <button mat-icon-button type="button" aria-label="Edit customer">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button type="button" aria-label="Refresh orders">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button type="button" aria-label="More actions">
            <mat-icon>more_vert</mat-icon>
          </button>
          <button mat-icon-button type="button" aria-label="Delete invoice" disabled>
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </section>
    `,
  }),
};

export const Fabs: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>FAB</h3>
        <div class="parity-row">
          <button mat-fab type="button" aria-label="New invoice">
            <mat-icon>add</mat-icon>
          </button>
          <button mat-mini-fab type="button" aria-label="Compose note">
            <mat-icon>edit_note</mat-icon>
          </button>
          <button mat-fab type="button" aria-label="New invoice" disabled>
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </section>
      <section class="parity-section">
        <h3>Extended FAB</h3>
        <div class="parity-row">
          <button mat-fab extended type="button">
            <mat-icon>add</mat-icon>
            New order
          </button>
          <button mat-fab extended type="button" disabled>
            <mat-icon>add</mat-icon>
            New order
          </button>
        </div>
      </section>
    `,
  }),
};
