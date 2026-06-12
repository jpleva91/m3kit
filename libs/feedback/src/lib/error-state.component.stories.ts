import type { Meta, StoryObj } from '@storybook/angular';

import { ErrorStateComponent } from './error-state.component';

/** Local synthetic fixture; lib stories must not depend on @m3kit/testing. */
const SYNTHETIC_DETAILS = [
  'GET /api/invoices?page=1&size=50 -> 503 Service Unavailable',
  'request-id: 6f1c9a2e-demo-0042',
  'upstream: invoice-query timed out after 10000ms',
].join('\n');

const meta: Meta<ErrorStateComponent> = {
  component: ErrorStateComponent,
  title: 'Molecules/ErrorState',
  argTypes: {
    retry: { action: 'retry' },
  },
};
export default meta;
type Story = StoryObj<ErrorStateComponent>;

export const Default: Story = {
  args: {
    title: 'Could not load invoices',
    description: 'The invoice list did not respond. Your data is unchanged.',
  },
};

export const WithDetails: Story = {
  args: {
    title: 'Could not load invoices',
    description: 'The invoice list did not respond. Your data is unchanged.',
    details: SYNTHETIC_DETAILS,
  },
};

export const LongDescription: Story = {
  args: {
    icon: 'cloud_off',
    title: 'Orders report unavailable',
    description:
      'The orders report could not be generated because the reporting ' +
      'source for Q1 2026 is temporarily offline. Existing orders and ' +
      'customer records are not affected; retry in a few minutes or open ' +
      'the orders table directly for the raw records.',
  },
};

export const WithProjectedActions: Story = {
  args: {
    title: 'Could not save customer',
    description: 'Customer 0042 was not updated.',
    details: 'PUT /api/customers/0042 -> 409 Conflict (version 7 != 9)',
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-error-state [title]="title" [description]="description" [details]="details">
        <button m3kErrorStateActions type="button">Discard changes</button>
        <button m3kErrorStateActions type="button">Reload record</button>
      </m3k-error-state>
    `,
  }),
};
