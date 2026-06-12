import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';

/**
 * Parity gallery: raw Angular Material tabs with icon labels, lazily rendered
 * tab content (matTabContent templates) and a disabled tab.
 */
@Component({
  selector: 'parity-tabs-demo',
  standalone: true,
  imports: [MatIconModule, MatListModule, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-tab-group>
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="parity-tab-icon">receipt_long</mat-icon>
          Invoices
        </ng-template>
        <ng-template matTabContent>
          <div class="parity-pane">
            <p>128 open invoices, 17 overdue. Lazily instantiated on first visit.</p>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>INV-0042 — Acme Corp</span>
                <span matListItemLine>USD 4,820.00 · overdue 12 days</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>INV-0057 — Northwind Traders</span>
                <span matListItemLine>USD 1,265.40 · sent Mar 18</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>INV-0061 — Globex</span>
                <span matListItemLine>USD 980.00 · paid Mar 20</span>
              </mat-list-item>
            </mat-list>
          </div>
        </ng-template>
      </mat-tab>

      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="parity-tab-icon">shopping_cart</mat-icon>
          Orders
        </ng-template>
        <ng-template matTabContent>
          <div class="parity-pane">
            <p>
              96 orders today across 412 listed products. This pane only renders
            when its tab is activated — lazy loading via matTabContent.
            </p>
          </div>
        </ng-template>
      </mat-tab>

      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="parity-tab-icon">support_agent</mat-icon>
          Support
        </ng-template>
        <ng-template matTabContent>
          <div class="parity-pane">
            <p>23 open tickets; median first response 38 minutes.</p>
          </div>
        </ng-template>
      </mat-tab>

      <mat-tab label="Archive" disabled></mat-tab>
    </mat-tab-group>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 720px;
        padding: 16px;
      }
      .parity-pane {
        padding: 16px 8px;
      }
      .parity-pane p {
        margin-top: 0;
      }
      .parity-tab-icon {
        margin-right: 8px;
      }
    `,
  ],
})
class ParityTabsDemoComponent {}

const meta: Meta<ParityTabsDemoComponent> = {
  component: ParityTabsDemoComponent,
  title: 'Material Parity/Tabs',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityTabsDemoComponent>;

export const LazyTabs: Story = {};
