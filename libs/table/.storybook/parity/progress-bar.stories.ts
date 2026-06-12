import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/** Parity gallery: raw Angular Material progress bars, all four modes. */
const LAYOUT = `
  .parity-section { margin-block-end: 28px; max-inline-size: 480px; }
  .parity-section h3 {
    font: var(--mat-sys-title-small);
    color: var(--mat-sys-on-surface-variant);
    margin: 0 0 8px;
  }
  .parity-section p {
    font: var(--mat-sys-body-small);
    color: var(--mat-sys-on-surface-variant);
    margin: 8px 0 0;
  }
`;

const meta: Meta = {
  title: 'Atoms/ProgressBar',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatProgressBarModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const Modes: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Determinate</h3>
        <mat-progress-bar mode="determinate" [value]="65"
                          aria-label="Invoice export progress"></mat-progress-bar>
        <p>Exporting invoices — 782 of 1,204 rows written (65%).</p>
      </section>
      <section class="parity-section">
        <h3>Indeterminate</h3>
        <mat-progress-bar mode="indeterminate"
                          aria-label="Loading orders"></mat-progress-bar>
        <p>Loading the orders dataset…</p>
      </section>
      <section class="parity-section">
        <h3>Buffer</h3>
        <mat-progress-bar mode="buffer" [value]="40" [bufferValue]="70"
                          aria-label="Uploading attachment"></mat-progress-bar>
        <p>Uploading attachment — 40% sent, 70% buffered.</p>
      </section>
      <section class="parity-section">
        <h3>Query</h3>
        <mat-progress-bar mode="query"
                          aria-label="Preparing report"></mat-progress-bar>
        <p>Contacting the reporting engine…</p>
      </section>
    `,
  }),
};
