import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER } from 'rxjs';
import {
  InMemoryTableDataSource,
  TableDataSource,
  TableDefinition,
} from '@m3kit/core';

import { DataTableComponent } from './data-table.component';

interface InvoiceRow {
  readonly id: string;
  readonly customerName: string;
  readonly amount: number;
  readonly status: 'draft' | 'sent' | 'paid' | 'overdue';
  readonly issuedAt: Date;
}

const STATUSES: readonly InvoiceRow['status'][] = ['draft', 'sent', 'paid', 'overdue'];

const INVOICES: readonly InvoiceRow[] = Array.from({ length: 25 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(4, '0')}`,
  customerName: `Acme Corp ${i + 1}`,
  amount: Math.round((i + 1) * 137.25 * 100) / 100,
  status: STATUSES[i % STATUSES.length],
  issuedAt: new Date(2026, i % 12, (i % 27) + 1),
}));

const INVOICE_DEFINITION: TableDefinition<InvoiceRow> = {
  id: 'invoices',
  title: 'Invoices',
  description: 'All invoices issued to customers.',
  columns: [
    { key: 'id', header: 'Invoice', type: 'text', sortable: true, width: '120px' },
    { key: 'customerName', header: 'Customer', type: 'text', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      type: 'currency',
      sortable: true,
      align: 'end',
      format: { currencyCode: 'USD', digitsInfo: '1.2-2' },
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      format: { badgeColors: { paid: 'success', overdue: 'warn', sent: 'primary' } },
    },
    {
      key: 'issuedAt',
      header: 'Issued',
      type: 'date',
      sortable: true,
      format: { dateFormat: 'mediumDate' },
    },
  ],
  defaultSort: { key: 'issuedAt', direction: 'desc' },
  defaultPageSize: 10,
};

/** Data source that never emits, so the table stays in its loading state. */
const PENDING_DATA_SOURCE: TableDataSource<InvoiceRow> = {
  fetch: () => NEVER,
};

const meta: Meta<DataTableComponent<InvoiceRow>> = {
  component: DataTableComponent,
  title: 'Organisms/DataTable',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<DataTableComponent<InvoiceRow>>;

export const Invoices: Story = {
  args: {
    definition: INVOICE_DEFINITION,
    dataSource: new InMemoryTableDataSource(INVOICES),
  },
};

export const Filtered: Story = {
  args: {
    definition: INVOICE_DEFINITION,
    dataSource: new InMemoryTableDataSource(INVOICES),
    textFilter: 'Acme Corp 1',
  },
};

export const Empty: Story = {
  args: {
    definition: INVOICE_DEFINITION,
    dataSource: new InMemoryTableDataSource<InvoiceRow>([]),
  },
};

export const Loading: Story = {
  args: {
    definition: INVOICE_DEFINITION,
    dataSource: PENDING_DATA_SOURCE,
  },
};
