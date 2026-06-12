import type { Meta, StoryObj } from '@storybook/angular';

import { EmptyStateComponent } from './empty-state.component';

const meta: Meta<EmptyStateComponent> = {
  component: EmptyStateComponent,
  title: 'Molecules/EmptyState',
};
export default meta;
type Story = StoryObj<EmptyStateComponent>;

export const Default: Story = {
  args: {
    icon: 'inbox',
    title: 'No invoices yet',
    description: 'Invoices you issue will appear here.',
  },
};

export const TitleOnly: Story = {
  args: {
    icon: 'search_off',
    title: 'No results for "Customer 0999"',
  },
};

export const WithActions: Story = {
  args: {
    icon: 'receipt_long',
    title: 'No invoices yet',
    description: 'Create your first invoice or import existing records.',
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-empty-state [icon]="icon" [title]="title" [description]="description">
        <button m3kEmptyStateActions type="button">New invoice</button>
        <button m3kEmptyStateActions type="button">Import CSV</button>
      </m3k-empty-state>
    `,
  }),
};

export const LongDescription: Story = {
  args: {
    icon: 'filter_alt_off',
    title: 'No orders match these filters',
    description:
      'No orders were placed between 2026-01-01 and 2026-03-31 with status ' +
      '"overdue" for the selected customers. Widen the date range, clear the ' +
      'status filter, or remove the customer selection to see more results.',
  },
};
