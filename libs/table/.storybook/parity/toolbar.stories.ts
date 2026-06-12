import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Parity gallery: raw Angular Material toolbars (no m3kit wrapper). */
const LAYOUT = `
  mat-toolbar { margin-block-end: 24px; }
  .parity-spacer { flex: 1 1 auto; }
  .parity-title { font: var(--mat-sys-title-large); }
`;

const meta: Meta = {
  title: 'Atoms/Toolbar',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatToolbarModule, MatButtonModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj;

export const AppToolbar: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <mat-toolbar>
        <button mat-icon-button type="button" aria-label="Open navigation">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="parity-title">Invoice Reporting</span>
        <span class="parity-spacer"></span>
        <button mat-icon-button type="button" aria-label="Search invoices">
          <mat-icon>search</mat-icon>
        </button>
        <button mat-icon-button type="button" aria-label="Notifications">
          <mat-icon>notifications</mat-icon>
        </button>
        <button mat-icon-button type="button" aria-label="Account">
          <mat-icon>account_circle</mat-icon>
        </button>
      </mat-toolbar>
    `,
  }),
};

export const MultiRow: Story = {
  render: () => ({
    styles: [LAYOUT],
    template: `
      <mat-toolbar>
        <mat-toolbar-row>
          <button mat-icon-button type="button" aria-label="Back to reports">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <span class="parity-title">Orders — Q2 2026</span>
          <span class="parity-spacer"></span>
          <button mat-stroked-button type="button">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <button mat-icon-button type="button" aria-label="More actions">
            <mat-icon>more_vert</mat-icon>
          </button>
        </mat-toolbar-row>
        <mat-toolbar-row>
          <button mat-button type="button">Overview</button>
          <button mat-button type="button">By region</button>
          <button mat-button type="button">By product</button>
          <span class="parity-spacer"></span>
          <button mat-icon-button type="button" aria-label="Filter rows">
            <mat-icon>filter_list</mat-icon>
          </button>
        </mat-toolbar-row>
      </mat-toolbar>
    `,
  }),
};
