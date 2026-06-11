import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { ReportDefinition } from '@m3kit/core';

import { FilterFormComponent } from './filter-form.component';

interface OrderRow {
  readonly id: number;
  readonly productName: string;
  readonly quantity: number;
  readonly total: number;
  readonly placedAt: string;
  readonly status: string;
}

const ORDERS_DEFINITION: ReportDefinition<OrderRow> = {
  id: 'orders',
  title: 'Orders',
  columns: [
    { key: 'id', header: 'Order #', type: 'number', filterable: false },
    { key: 'productName', header: 'Product', type: 'text', filterable: true },
    { key: 'quantity', header: 'Quantity', type: 'number' },
    { key: 'total', header: 'Total', type: 'currency', filterable: true },
    { key: 'placedAt', header: 'Placed', type: 'date', filterable: true },
    { key: 'status', header: 'Status', type: 'badge', filterable: true },
  ],
};

const STATUS_OPTIONS = {
  status: [
    { value: 'pending', label: 'Pending' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
} as const;

const meta: Meta<FilterFormComponent<OrderRow>> = {
  component: FilterFormComponent,
  title: 'Forms/FilterForm',
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideNativeDateAdapter()] }),
  ],
};
export default meta;
type Story = StoryObj<FilterFormComponent<OrderRow>>;

export const Default: Story = {
  args: {
    definition: ORDERS_DEFINITION,
    options: STATUS_OPTIONS,
  },
};

export const TextColumnsOnly: Story = {
  args: {
    definition: {
      id: 'products',
      title: 'Products',
      columns: [
        { key: 'productName', header: 'Product', type: 'text', filterable: true },
        { key: 'quantity', header: 'Quantity', type: 'number', filterable: false },
      ],
    } as ReportDefinition<OrderRow>,
  },
};
