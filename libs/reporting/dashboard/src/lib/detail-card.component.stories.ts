import type { Meta, StoryObj } from '@storybook/angular';

import { DetailCardComponent, DetailCardRow } from './detail-card.component';

/** Local synthetic fixture; lib stories must not depend on @reporting/testing. */
const INVOICE_ROWS: readonly DetailCardRow[] = [
  { label: 'Number', value: 'INV-2026-0042' },
  { label: 'Customer', value: 'Customer 0117' },
  { label: 'Amount', value: '$1,250.00' },
  { label: 'Status', value: 'sent' },
  { label: 'Due', value: '2026-04-15' },
];

const meta: Meta<DetailCardComponent> = {
  component: DetailCardComponent,
  title: 'Dashboard/DetailCard',
};
export default meta;
type Story = StoryObj<DetailCardComponent>;

export const Default: Story = {
  args: {
    title: 'Latest invoice',
    rows: INVOICE_ROWS,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Latest invoice',
    subtitle: 'Issued 2026-03-16',
    rows: INVOICE_ROWS,
  },
};

export const WithActionsAndFooter: Story = {
  args: {
    title: 'Top customer',
    subtitle: 'By total billed',
    rows: [
      { label: 'Customer', value: 'Customer 0042' },
      { label: 'Invoices', value: 7 },
      { label: 'Total billed', value: '$18,400.00' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <rpt-detail-card [title]="title" [subtitle]="subtitle" [rows]="rows">
        <button rptDetailCardActions type="button">Refresh</button>
        <a rptDetailCardFooter href="#">View all customers</a>
      </rpt-detail-card>
    `,
  }),
};

export const Empty: Story = {
  args: {
    title: 'Latest invoice',
    rows: [],
  },
};
