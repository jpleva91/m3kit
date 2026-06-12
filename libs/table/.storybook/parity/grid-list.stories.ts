import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';

interface MetricTile {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly cols: number;
  readonly rows: number;
}

const METRIC_TILES: readonly MetricTile[] = [
  { label: 'Open invoices', value: '128', icon: 'receipt_long', cols: 2, rows: 2 },
  { label: 'Overdue', value: '17', icon: 'warning', cols: 1, rows: 1 },
  { label: 'Paid this month', value: '342', icon: 'paid', cols: 1, rows: 1 },
  { label: 'Active customers', value: '1,284', icon: 'group', cols: 2, rows: 1 },
  { label: 'Orders today', value: '96', icon: 'shopping_cart', cols: 1, rows: 1 },
  { label: 'Tickets open', value: '23', icon: 'support_agent', cols: 1, rows: 1 },
  { label: 'Products listed', value: '412', icon: 'inventory_2', cols: 2, rows: 1 },
];

/**
 * Parity gallery: raw Angular Material grid list rendering a metric mosaic
 * with mixed colspan/rowspan tiles, surfaces driven entirely by system tokens.
 */
@Component({
  selector: 'parity-grid-list-demo',
  standalone: true,
  imports: [MatGridListModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-grid-list cols="4" rowHeight="120px" gutterSize="12px">
      @for (tile of tiles; track tile.label) {
        <mat-grid-tile [colspan]="tile.cols" [rowspan]="tile.rows">
          <div class="parity-tile" [class.parity-tile-hero]="tile.rows > 1">
            <mat-icon>{{ tile.icon }}</mat-icon>
            <span class="parity-tile-value">{{ tile.value }}</span>
            <span class="parity-tile-label">{{ tile.label }}</span>
          </div>
        </mat-grid-tile>
      }
    </mat-grid-list>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 16px;
        max-width: 880px;
      }
      .parity-tile {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-radius: var(--app-radius-card);
        background: var(--mat-sys-surface-container);
        color: var(--mat-sys-on-surface);
      }
      .parity-tile-hero {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
      .parity-tile-value {
        font: var(--mat-sys-headline-small);
        font-family: var(--app-font-data);
      }
      .parity-tile-label {
        font: var(--mat-sys-label-medium);
        color: var(--mat-sys-on-surface-variant);
      }
      .parity-tile-hero .parity-tile-label {
        color: var(--mat-sys-on-primary-container);
      }
    `,
  ],
})
class ParityGridListDemoComponent {
  protected readonly tiles = METRIC_TILES;
}

const meta: Meta<ParityGridListDemoComponent> = {
  component: ParityGridListDemoComponent,
  title: 'Atoms/Grid List',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityGridListDemoComponent>;

export const MetricMosaic: Story = {};
