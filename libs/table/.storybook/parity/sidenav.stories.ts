import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Parity gallery: raw Angular Material sidenav in a story-contained mini app
 * layout — toolbar, side-mode drawer with a nav list, and scrolling content.
 */
@Component({
  selector: 'parity-sidenav-demo',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parity-frame">
      <mat-toolbar>
        <button mat-icon-button (click)="drawer.toggle()" aria-label="Toggle navigation">
          <mat-icon>menu</mat-icon>
        </button>
        <span>Reporting console</span>
        <span class="parity-spacer"></span>
        <button mat-icon-button aria-label="Account">
          <mat-icon>account_circle</mat-icon>
        </button>
      </mat-toolbar>

      <mat-sidenav-container class="parity-container">
        <mat-sidenav #drawer mode="side" opened>
          <mat-nav-list>
            <a mat-list-item activated>
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Overview</span>
            </a>
            <a mat-list-item>
              <mat-icon matListItemIcon>group</mat-icon>
              <span matListItemTitle>Customers</span>
            </a>
            <a mat-list-item>
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>Invoices</span>
            </a>
            <a mat-list-item>
              <mat-icon matListItemIcon>shopping_cart</mat-icon>
              <span matListItemTitle>Orders</span>
            </a>
            <a mat-list-item>
              <mat-icon matListItemIcon>support_agent</mat-icon>
              <span matListItemTitle>Support</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content class="parity-content">
          <h2>Overview</h2>
          <p>
            March receivables are tracking 6.2% ahead of February. 17 invoices
            are overdue; the largest, INV-0042 for Acme Corp, is 12 days past
            due. Support volume is steady at 23 open tickets.
          </p>
          <p>
            Use the navigation rail to drill into customers, invoices, orders
            and support tickets. Toggle the drawer with the toolbar menu button
            to verify the over/side transition styling.
          </p>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .parity-frame {
        height: 420px;
        display: flex;
        flex-direction: column;
        border-radius: var(--app-radius-card);
        overflow: hidden;
        border: 1px solid var(--mat-sys-outline-variant);
      }
      .parity-container {
        flex: 1;
      }
      mat-sidenav {
        width: 240px;
      }
      .parity-content {
        padding: 16px 24px;
      }
      .parity-spacer {
        flex: 1;
      }
      h2 {
        font: var(--mat-sys-title-large);
        margin-top: 0;
      }
    `,
  ],
})
class ParitySidenavDemoComponent {}

const meta: Meta<ParitySidenavDemoComponent> = {
  component: ParitySidenavDemoComponent,
  title: 'Material Parity/Sidenav',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParitySidenavDemoComponent>;

export const MiniLayout: Story = {};
