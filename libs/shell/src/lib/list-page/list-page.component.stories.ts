import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ListPageComponent } from './list-page.component';

/** Shared token-only styling for the synthetic toolbar and list content. */
const DEMO_STYLES = `
  .demo-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .demo-toolbar .chip {
    padding: 4px 12px;
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: var(--app-radius-badge);
    font: var(--mat-sys-label-large);
    color: var(--mat-sys-on-surface-variant);
  }
  .demo-toolbar .chip--active {
    background: var(--mat-sys-secondary-container);
    color: var(--mat-sys-on-secondary-container);
    border-color: transparent;
  }
  .demo-toolbar .count {
    margin-left: auto;
    font: var(--mat-sys-body-medium);
    color: var(--mat-sys-on-surface-variant);
  }
  .demo-rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .demo-rows li {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 10px 0;
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
  .demo-empty {
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 32px 16px;
    text-align: center;
  }
  .demo-empty h2 {
    margin: 0;
    font: var(--mat-sys-title-medium);
    color: var(--mat-sys-on-surface);
  }
  .demo-empty p {
    margin: 0;
    font: var(--mat-sys-body-medium);
    color: var(--mat-sys-on-surface-variant);
  }
`;

const meta: Meta<ListPageComponent> = {
  component: ListPageComponent,
  title: 'Templates/ListPage',
  decorators: [
    applicationConfig({
      providers: [
        provideNoopAnimations(),
        provideRouter([], withDisabledInitialNavigation()),
      ],
    }),
    moduleMetadata({ imports: [MatButtonModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj<ListPageComponent>;

/**
 * A full invoices index: breadcrumb trail, header with primary action,
 * a filter toolbar in the `[m3kListPageToolbar]` slot, and the invoice
 * list in the default slot.
 */
export const InvoicesIndex: Story = {
  args: {
    title: 'Invoices',
    description: 'Billing period June 2026 · all regions',
    breadcrumbs: [{ label: 'Reports', path: '/reports' }, { label: 'Invoices' }],
    primaryAction: { label: 'New invoice', icon: 'add' },
  },
  render: (args) => ({
    props: args,
    styles: [DEMO_STYLES],
    template: `
      <m3k-list-page
        [title]="title"
        [description]="description"
        [breadcrumbs]="breadcrumbs"
        [primaryAction]="primaryAction"
      >
        <div m3kListPageToolbar class="demo-toolbar">
          <span class="chip chip--active">All</span>
          <span class="chip">Sent</span>
          <span class="chip">Paid</span>
          <span class="chip">Overdue</span>
          <span class="count">5 of 214 invoices</span>
        </div>
        <ul class="demo-rows">
          <li><span>INV-2041 — Acme Manufacturing</span><span class="amount">USD 12,480.00</span></li>
          <li><span>INV-2057 — Northwind Traders</span><span class="amount">USD 1,265.40</span></li>
          <li><span>INV-2061 — Globex</span><span class="amount">USD 980.00</span></li>
          <li><span>INV-2063 — Initech</span><span class="amount">USD 4,512.75</span></li>
          <li><span>INV-2066 — Stark Industrial Supply</span><span class="amount">USD 23,940.00</span></li>
        </ul>
      </m3k-list-page>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Invoices' })).toBeTruthy();
    await expect(
      canvas.getByRole('button', { name: /New invoice/ }),
    ).toBeTruthy();
    await expect(canvas.getByText('INV-2041 — Acme Manufacturing')).toBeTruthy();
  },
};

/**
 * `empty` swaps the default slot for the `[m3kListPageEmpty]` slot while
 * the filter toolbar stays available (the filters may be the reason the
 * list is empty). The projected markup here is a stand-in for the
 * feedback library's empty-state component, which drops into the same
 * slot without this library depending on it.
 */
export const EmptyResult: Story = {
  args: {
    title: 'Support tickets',
    description: 'Open queue, oldest first',
    primaryAction: { label: 'New ticket', icon: 'add' },
    empty: true,
  },
  render: (args) => ({
    props: args,
    styles: [DEMO_STYLES],
    template: `
      <m3k-list-page
        [title]="title"
        [description]="description"
        [primaryAction]="primaryAction"
        [empty]="empty"
      >
        <div m3kListPageToolbar class="demo-toolbar">
          <span class="chip chip--active">Priority: urgent</span>
          <span class="chip">Assignee: any</span>
          <span class="count">0 of 23 tickets</span>
        </div>
        <ul class="demo-rows">
          <li><span>Never rendered while empty</span></li>
        </ul>
        <div m3kListPageEmpty class="demo-empty">
          <h2>No tickets match the current filters</h2>
          <p>Clear the priority filter to see all 23 open tickets.</p>
          <button mat-stroked-button type="button">Clear filters</button>
        </div>
      </m3k-list-page>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('No tickets match the current filters'),
    ).toBeTruthy();
    await expect(
      canvas.queryByText('Never rendered while empty'),
    ).toBeNull();
  },
};

/** A read-only index: no primary action, no breadcrumbs — header and list only. */
export const NoPrimaryAction: Story = {
  args: {
    title: 'Audit log',
    description: 'Order events, newest first',
  },
  render: (args) => ({
    props: args,
    styles: [DEMO_STYLES],
    template: `
      <m3k-list-page [title]="title" [description]="description">
        <ul class="demo-rows">
          <li><span>ORD-7731 marked shipped</span><span class="meta">2026-06-11 16:42</span></li>
          <li><span>ORD-7728 payment captured</span><span class="meta">2026-06-11 14:05</span></li>
          <li><span>ORD-7725 created from quote Q-118</span><span class="meta">2026-06-11 09:30</span></li>
        </ul>
      </m3k-list-page>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Audit log' })).toBeTruthy();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};
