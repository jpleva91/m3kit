import type { Meta, StoryObj } from '@storybook/angular';

import { StatListComponent, StatListItem } from './stat-list.component';

/** Local synthetic data; lib stories must not depend on @m3kit/testing. */
const BILLING_SUMMARY: readonly StatListItem[] = [
  { label: 'Invoices issued', value: 142 },
  { label: 'Total billed', value: 1284902.44, format: 'currency', delta: 4.2 },
  { label: 'Collected', value: 1112480.1, format: 'currency', delta: 6.8 },
  { label: 'Overdue balance', value: 86240.55, format: 'currency', delta: -2.1 },
  { label: 'Collection rate', value: 0.866, format: 'percent', delta: 1.2 },
];

const ORDER_SUMMARY: readonly StatListItem[] = [
  { label: 'Open orders', value: 128 },
  { label: 'Awaiting fulfillment', value: 37 },
  { label: 'Shipped this week', value: 412 },
  { label: 'Average order value', value: 284.5, format: 'currency' },
  { label: 'Top region', value: 'EMEA — Central' },
];

const SUPPORT_SUMMARY: readonly StatListItem[] = [
  { label: 'Open tickets', value: 64, delta: -12 },
  { label: 'First response (median)', value: '1h 24m' },
  { label: 'Resolved this week', value: 188, delta: 23 },
  { label: 'Escalation rate', value: 0.058, format: 'percent', delta: -0.4 },
  { label: 'CSAT', value: 0.94, format: 'percent', delta: 0 },
];

const meta: Meta<StatListComponent> = {
  component: StatListComponent,
  title: 'Molecules/StatList',
};
export default meta;
type Story = StoryObj<StatListComponent>;

export const Default: Story = {
  args: {
    items: BILLING_SUMMARY,
  },
};

export const Dense: Story = {
  args: {
    items: SUPPORT_SUMMARY,
    dense: true,
  },
};

export const WithoutDeltas: Story = {
  args: {
    items: ORDER_SUMMARY,
  },
};

export const EuroCurrency: Story = {
  args: {
    items: [
      { label: 'Total billed', value: 412380.2, format: 'currency', delta: 2.4 },
      { label: 'Collected', value: 398104.75, format: 'currency', delta: 3.1 },
      { label: 'Overdue balance', value: 14275.45, format: 'currency', delta: -0.8 },
    ],
    currencyCode: 'EUR',
  },
};

export const EdgeSingleRow: Story = {
  args: {
    items: [{ label: 'Invoices issued', value: 1 }],
  },
};
