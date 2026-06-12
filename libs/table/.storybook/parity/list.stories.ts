import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

/**
 * Parity gallery: raw Angular Material lists — nav list, two-line list with
 * icons and meta, and a selection list with checked/disabled options.
 */
@Component({
  selector: 'parity-list-demo',
  standalone: true,
  imports: [MatDividerModule, MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parity-row">
      <section>
        <h3>Navigation list</h3>
        <mat-nav-list>
          <a mat-list-item activated>
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Overview</span>
          </a>
          <a mat-list-item>
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Invoices</span>
          </a>
          <a mat-list-item>
            <mat-icon matListItemIcon>shopping_cart</mat-icon>
            <span matListItemTitle>Orders</span>
          </a>
          <a mat-list-item disabled>
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span matListItemTitle>Products (archived)</span>
          </a>
        </mat-nav-list>
      </section>

      <section>
        <h3>Two-line list</h3>
        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>support_agent</mat-icon>
            <span matListItemTitle>Ticket #5817 — Export job stuck</span>
            <span matListItemLine>Opened by Dana Whitfield · High priority</span>
            <span matListItemMeta>2h</span>
          </mat-list-item>
          <mat-divider></mat-divider>
          <mat-list-item>
            <mat-icon matListItemIcon>support_agent</mat-icon>
            <span matListItemTitle>Ticket #5809 — Wrong tax on invoice</span>
            <span matListItemLine>Opened by Marcus Reed · Medium priority</span>
            <span matListItemMeta>1d</span>
          </mat-list-item>
          <mat-divider></mat-divider>
          <mat-list-item>
            <mat-icon matListItemIcon>support_agent</mat-icon>
            <span matListItemTitle>Ticket #5790 — Add CSV column mapping</span>
            <span matListItemLine>Opened by Priya Natarajan · Low priority</span>
            <span matListItemMeta>3d</span>
          </mat-list-item>
        </mat-list>
      </section>

      <section>
        <h3>Selection list</h3>
        <mat-selection-list>
          <mat-list-option selected>Email weekly invoice digest</mat-list-option>
          <mat-list-option selected>Alert on overdue invoices</mat-list-option>
          <mat-list-option>Notify on new support tickets</mat-list-option>
          <mat-list-option disabled>Legacy order sync (retired)</mat-list-option>
        </mat-selection-list>
      </section>
    </div>
  `,
  styles: [
    `
      .parity-row {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        align-items: flex-start;
        padding: 16px;
      }
      section {
        width: 340px;
        border-radius: var(--app-radius-card);
        background: var(--mat-sys-surface-container-low);
        padding: 8px 0;
      }
      h3 {
        margin: 8px 16px;
        font: var(--mat-sys-title-small);
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
class ParityListDemoComponent {}

const meta: Meta<ParityListDemoComponent> = {
  component: ParityListDemoComponent,
  title: 'Material Parity/List',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityListDemoComponent>;

export const Lists: Story = {};
