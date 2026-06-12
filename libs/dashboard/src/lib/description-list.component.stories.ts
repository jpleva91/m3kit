import type { Meta, StoryObj } from '@storybook/angular';

import { DescriptionListComponent, DescriptionListItem } from './description-list.component';

/** Local synthetic data; lib stories must not depend on @m3kit/testing. */
const CUSTOMER_RECORD: readonly DescriptionListItem[] = [
  { term: 'Customer', description: 'Acme Manufacturing GmbH' },
  { term: 'Account ID', description: 'CUST-00482', mono: true },
  { term: 'Billing email', description: 'accounts@acme-mfg.example' },
  { term: 'Payment terms', description: 'Net 30' },
  { term: 'VAT number', description: 'DE 271 828 182', mono: true },
  { term: 'Region', description: 'EMEA — Central' },
];

const INVOICE_RECORD: readonly DescriptionListItem[] = [
  { term: 'Invoice', description: 'INV-2026-0042', mono: true },
  { term: 'Issued', description: '2026-03-16', mono: true },
  { term: 'Due', description: '2026-04-15', mono: true },
  { term: 'Amount', description: '$12,480.00', mono: true },
  { term: 'Status', description: 'Sent' },
  { term: 'Purchase order', description: 'PO-88231', mono: true },
];

const meta: Meta<DescriptionListComponent> = {
  component: DescriptionListComponent,
  title: 'Molecules/DescriptionList',
};
export default meta;
type Story = StoryObj<DescriptionListComponent>;

export const Default: Story = {
  args: {
    items: CUSTOMER_RECORD,
  },
};

export const TwoColumns: Story = {
  args: {
    items: CUSTOMER_RECORD,
    columns: 2,
  },
};

export const MonoIdentifiers: Story = {
  args: {
    items: INVOICE_RECORD,
    columns: 2,
  },
};

export const EdgeLongValues: Story = {
  args: {
    items: [
      {
        term: 'Shipping address',
        description: 'Acme Manufacturing GmbH, Werkstrasse 14, Gebäude C, 68219 Mannheim, Germany',
      },
      {
        term: 'Tracking reference',
        description: '1Z-999-AA1-01-2345-6784-XK-2026-0042-EXPRESS-PRIORITY',
        mono: true,
      },
    ],
    columns: 2,
  },
};
