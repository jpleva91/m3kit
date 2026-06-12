import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TabsPageComponent, TabsPagePanelDirective } from './tabs-page.component';

/** Shared token-only styling for the synthetic panel content. */
const PANEL_STYLES = `
  .demo-facts {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 8px 24px;
    margin: 0;
    max-width: 560px;
    font: var(--mat-sys-body-medium);
    color: var(--mat-sys-on-surface);
  }
  .demo-facts dt {
    color: var(--mat-sys-on-surface-variant);
  }
  .demo-facts dd {
    margin: 0;
    font-family: var(--app-font-data);
    font-variant-numeric: tabular-nums;
  }
  .demo-rows {
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 560px;
  }
  .demo-rows li {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 8px 0;
    border-bottom: 1px solid var(--mat-sys-outline-variant);
    font: var(--mat-sys-body-medium);
    color: var(--mat-sys-on-surface);
  }
  .demo-rows .amount {
    font-family: var(--app-font-data);
    font-variant-numeric: tabular-nums;
  }
  .demo-rows .meta {
    color: var(--mat-sys-on-surface-variant);
  }
`;

const meta: Meta<TabsPageComponent> = {
  component: TabsPageComponent,
  title: 'Templates/TabsPage',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [TabsPagePanelDirective] }),
  ],
};
export default meta;
type Story = StoryObj<TabsPageComponent>;

/**
 * An invoice detail page: overview facts, the line-item breakdown, and an
 * activity feed whose tab carries a new-events count badge.
 */
export const InvoiceDetail: Story = {
  args: {
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'line-items', label: 'Line items' },
      { id: 'activity', label: 'Activity', badge: 3 },
    ],
    activeTabId: 'overview',
  },
  render: (args) => ({
    props: args,
    styles: [PANEL_STYLES],
    template: `
      <m3k-tabs-page [tabs]="tabs" [activeTabId]="activeTabId">
        <ng-template m3kTabPanel="overview">
          <dl class="demo-facts">
            <dt>Invoice</dt><dd>INV-2041</dd>
            <dt>Customer</dt><dd>Acme Manufacturing</dd>
            <dt>Status</dt><dd>sent</dd>
            <dt>Issued</dt><dd>2026-05-28</dd>
            <dt>Due</dt><dd>2026-06-27</dd>
            <dt>Total</dt><dd>USD 12,480.00</dd>
          </dl>
        </ng-template>
        <ng-template m3kTabPanel="line-items">
          <ul class="demo-rows">
            <li><span>Conveyor belt assembly × 4</span><span class="amount">USD 7,920.00</span></li>
            <li><span>Hydraulic press service × 1</span><span class="amount">USD 2,360.00</span></li>
            <li><span>Spare roller kit × 12</span><span class="amount">USD 1,560.00</span></li>
            <li><span>Freight &amp; handling</span><span class="amount">USD 640.00</span></li>
          </ul>
        </ng-template>
        <ng-template m3kTabPanel="activity">
          <ul class="demo-rows">
            <li><span>Payment reminder sent to billing&#64;acme-mfg.example</span><span class="meta">2026-06-10</span></li>
            <li><span>Invoice viewed by customer</span><span class="meta">2026-06-09</span></li>
            <li><span>Invoice sent</span><span class="meta">2026-05-28</span></li>
          </ul>
        </ng-template>
      </m3k-tabs-page>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ['Overview', 'Line items', 'Activity']) {
      await expect(canvas.getByText(label)).toBeTruthy();
    }
    await expect(canvas.getByText('INV-2041')).toBeTruthy();
  },
};

/** Leading Material Symbols icons on each tab label. */
export const IconTabs: Story = {
  args: {
    tabs: [
      { id: 'orders', label: 'Orders', icon: 'shopping_cart' },
      { id: 'invoices', label: 'Invoices', icon: 'receipt_long', badge: 17 },
      { id: 'tickets', label: 'Support', icon: 'support_agent', badge: '99+' },
    ],
    activeTabId: 'invoices',
  },
  render: (args) => ({
    props: args,
    styles: [PANEL_STYLES],
    template: `
      <m3k-tabs-page [tabs]="tabs" [activeTabId]="activeTabId">
        <ng-template m3kTabPanel="orders">
          <p>96 orders today across 412 listed products.</p>
        </ng-template>
        <ng-template m3kTabPanel="invoices">
          <ul class="demo-rows">
            <li><span>INV-2041 — Acme Manufacturing</span><span class="amount">USD 12,480.00</span></li>
            <li><span>INV-2057 — Northwind Traders</span><span class="amount">USD 1,265.40</span></li>
            <li><span>INV-2061 — Globex</span><span class="amount">USD 980.00</span></li>
          </ul>
        </ng-template>
        <ng-template m3kTabPanel="tickets">
          <p>23 open tickets; median first response 38 minutes.</p>
        </ng-template>
      </m3k-tabs-page>
    `,
  }),
};

/**
 * Many tabs in a constrained column: the Material header paginates with
 * chevrons instead of wrapping or shrinking labels.
 */
export const ManyTabsOverflow: Story = {
  args: {
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'orders', label: 'Orders', badge: 96 },
      { id: 'invoices', label: 'Invoices', badge: 17 },
      { id: 'payments', label: 'Payments' },
      { id: 'shipments', label: 'Shipments' },
      { id: 'returns', label: 'Returns', badge: 4 },
      { id: 'contacts', label: 'Contacts' },
      { id: 'contracts', label: 'Contracts' },
      { id: 'tickets', label: 'Support tickets', badge: 23 },
      { id: 'notes', label: 'Notes' },
    ],
    activeTabId: 'overview',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 560px;">
        <m3k-tabs-page [tabs]="tabs" [activeTabId]="activeTabId">
          <ng-template m3kTabPanel="overview">
            <p>Customer 360 for Acme Manufacturing — ten sections, one header.</p>
          </ng-template>
        </m3k-tabs-page>
      </div>
    `,
  }),
};
