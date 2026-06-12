import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

/** Parity gallery: raw Angular Material button toggles (no m3kit wrapper). */
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
    gap: 16px;
  }
`;

const meta: Meta = {
  title: 'Atoms/ButtonToggle',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatButtonToggleModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const SingleSelect: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Report period (text, one selected)</h3>
        <div class="parity-row">
          <mat-button-toggle-group value="30d" aria-label="Report period">
            <mat-button-toggle value="7d">7 days</mat-button-toggle>
            <mat-button-toggle value="30d">30 days</mat-button-toggle>
            <mat-button-toggle value="90d">Quarter</mat-button-toggle>
            <mat-button-toggle value="custom" disabled>Custom</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </section>
      <section class="parity-section">
        <h3>View density (icons)</h3>
        <div class="parity-row">
          <mat-button-toggle-group value="table" aria-label="View">
            <mat-button-toggle value="table" aria-label="Table view">
              <mat-icon>table_rows</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="grid" aria-label="Grid view">
              <mat-icon>grid_view</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="chart" aria-label="Chart view">
              <mat-icon>bar_chart</mat-icon>
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </section>
      <section class="parity-section">
        <h3>Whole group disabled</h3>
        <div class="parity-row">
          <mat-button-toggle-group value="paid" disabled aria-label="Status filter">
            <mat-button-toggle value="draft">Draft</mat-button-toggle>
            <mat-button-toggle value="sent">Sent</mat-button-toggle>
            <mat-button-toggle value="paid">Paid</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </section>
    `,
  }),
};

export const MultiSelect: Story = {
  render: () => ({
    props: { columns: ['status', 'total'] },
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Visible columns (multiple, two checked)</h3>
        <div class="parity-row">
          <mat-button-toggle-group multiple [value]="columns" aria-label="Visible columns">
            <mat-button-toggle value="status">Status</mat-button-toggle>
            <mat-button-toggle value="total">Total</mat-button-toggle>
            <mat-button-toggle value="region">Region</mat-button-toggle>
            <mat-button-toggle value="owner" disabled>Owner</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </section>
    `,
  }),
};
