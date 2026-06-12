import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Parity gallery: raw Angular Material progress spinners. */
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
    align-items: flex-end;
    gap: 32px;
  }
  .parity-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .parity-cell figcaption {
    font: var(--mat-sys-label-small);
    color: var(--mat-sys-on-surface-variant);
  }
`;

const meta: Meta = {
  title: 'Material Parity/ProgressSpinner',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatProgressSpinnerModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <section class="parity-section">
        <h3>Determinate (reconciliation progress)</h3>
        <div class="parity-row">
          <figure class="parity-cell">
            <mat-progress-spinner mode="determinate" [value]="25"
                                  aria-label="25 percent reconciled"></mat-progress-spinner>
            <figcaption>25%</figcaption>
          </figure>
          <figure class="parity-cell">
            <mat-progress-spinner mode="determinate" [value]="50"
                                  aria-label="50 percent reconciled"></mat-progress-spinner>
            <figcaption>50%</figcaption>
          </figure>
          <figure class="parity-cell">
            <mat-progress-spinner mode="determinate" [value]="75"
                                  aria-label="75 percent reconciled"></mat-progress-spinner>
            <figcaption>75%</figcaption>
          </figure>
          <figure class="parity-cell">
            <mat-progress-spinner mode="determinate" [value]="100"
                                  aria-label="Reconciliation complete"></mat-progress-spinner>
            <figcaption>100%</figcaption>
          </figure>
        </div>
      </section>
      <section class="parity-section">
        <h3>Indeterminate, diameters and stroke</h3>
        <div class="parity-row">
          <figure class="parity-cell">
            <mat-spinner [diameter]="24" aria-label="Loading"></mat-spinner>
            <figcaption>24px</figcaption>
          </figure>
          <figure class="parity-cell">
            <mat-spinner [diameter]="40" aria-label="Loading"></mat-spinner>
            <figcaption>40px</figcaption>
          </figure>
          <figure class="parity-cell">
            <mat-spinner [diameter]="56" aria-label="Loading"></mat-spinner>
            <figcaption>56px</figcaption>
          </figure>
          <figure class="parity-cell">
            <mat-spinner [diameter]="56" [strokeWidth]="8"
                         aria-label="Loading"></mat-spinner>
            <figcaption>56px / stroke 8</figcaption>
          </figure>
        </div>
      </section>
    `,
  }),
};
