import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Parity gallery: raw Angular Material tooltips (no m3kit wrapper).
 * Hover or keyboard-focus the controls to show each tooltip.
 */
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
    gap: 12px;
    padding-block: 24px;
  }
`;

const meta: Meta = {
  title: 'Material Parity/Tooltip',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatTooltipModule, MatButtonModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Positions</h3>
        <div class="parity-row">
          <button mat-stroked-button type="button"
                  matTooltip="Tooltip above" matTooltipPosition="above">Above</button>
          <button mat-stroked-button type="button"
                  matTooltip="Tooltip below" matTooltipPosition="below">Below</button>
          <button mat-stroked-button type="button"
                  matTooltip="Tooltip to the left" matTooltipPosition="left">Left</button>
          <button mat-stroked-button type="button"
                  matTooltip="Tooltip to the right" matTooltipPosition="right">Right</button>
        </div>
      </section>
      <section class="parity-section">
        <h3>Realistic usage</h3>
        <div class="parity-row">
          <button mat-icon-button type="button" aria-label="Refresh report data"
                  matTooltip="Refresh report data">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button type="button" aria-label="Export filtered rows as CSV"
                  matTooltip="Export the 128 filtered rows as CSV">
            <mat-icon>download</mat-icon>
          </button>
          <button mat-icon-button type="button" aria-label="Column settings"
                  matTooltip="Show, hide, and reorder columns"
                  [matTooltipShowDelay]="500">
            <mat-icon>view_column</mat-icon>
          </button>
          <button mat-flat-button type="button"
                  matTooltip="Sends the invoice to the customer's billing contact and marks it as Sent">
            Send invoice
          </button>
          <button mat-stroked-button type="button"
                  matTooltip="This never shows" [matTooltipDisabled]="true">
            Tooltip disabled
          </button>
        </div>
      </section>
    `,
  }),
};
