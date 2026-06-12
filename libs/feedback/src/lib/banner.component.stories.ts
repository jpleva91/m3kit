import type { Meta, StoryObj } from '@storybook/angular';

import { BannerComponent } from './banner.component';

const meta: Meta<BannerComponent> = {
  component: BannerComponent,
  title: 'Molecules/Banner',
  argTypes: {
    severity: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
};
export default meta;
type Story = StoryObj<BannerComponent>;

export const Info: Story = {
  args: { severity: 'info' },
  render: (args) => ({
    props: args,
    template: `
      <m3k-banner [severity]="severity" [dismissible]="dismissible">
        Invoice export started — the CSV will appear under Reports when ready.
      </m3k-banner>
    `,
  }),
};

export const Success: Story = {
  args: { severity: 'success' },
  render: (args) => ({
    props: args,
    template: `
      <m3k-banner [severity]="severity" [dismissible]="dismissible">
        Payment recorded — invoice INV-2026-0042 is now marked paid.
      </m3k-banner>
    `,
  }),
};

export const Warning: Story = {
  args: { severity: 'warning' },
  render: (args) => ({
    props: args,
    template: `
      <m3k-banner [severity]="severity" [dismissible]="dismissible">
        3 invoices are due within the next 7 days.
      </m3k-banner>
    `,
  }),
};

export const Error: Story = {
  args: { severity: 'error' },
  render: (args) => ({
    props: args,
    template: `
      <m3k-banner [severity]="severity" [dismissible]="dismissible">
        7 invoices are overdue — totaling $12,840.00.
      </m3k-banner>
    `,
  }),
};

export const Dismissible: Story = {
  args: { severity: 'info', dismissible: true },
  render: (args) => ({
    props: args,
    template: `
      <m3k-banner [severity]="severity" [dismissible]="dismissible">
        12 new orders arrived since your last visit.
      </m3k-banner>
    `,
  }),
};

export const WithAction: Story = {
  args: { severity: 'error', dismissible: true },
  render: (args) => ({
    props: args,
    template: `
      <m3k-banner [severity]="severity" [dismissible]="dismissible">
        Customer 0117 has 2 invoices more than 30 days overdue.
        <button m3kBannerAction type="button">Review invoices</button>
      </m3k-banner>
    `,
  }),
};
