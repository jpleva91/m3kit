import type { Meta, StoryObj } from '@storybook/angular';

import { PageToolbarComponent } from './page-toolbar.component';

const meta: Meta<PageToolbarComponent> = {
  component: PageToolbarComponent,
  title: 'Table/PageToolbar',
};
export default meta;
type Story = StoryObj<PageToolbarComponent>;

export const Default: Story = {
  args: {
    title: 'Orders',
  },
};

export const WithRowCount: Story = {
  args: {
    title: 'Orders',
    rowCount: 128,
  },
};

export const WithActions: Story = {
  args: {
    title: 'Products',
    rowCount: 12,
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-page-toolbar [title]="title" [rowCount]="rowCount">
        <button type="button">Export CSV</button>
      </m3k-page-toolbar>
    `,
  }),
};
