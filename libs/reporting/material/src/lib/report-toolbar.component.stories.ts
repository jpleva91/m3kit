import type { Meta, StoryObj } from '@storybook/angular';

import { ReportToolbarComponent } from './report-toolbar.component';

const meta: Meta<ReportToolbarComponent> = {
  component: ReportToolbarComponent,
  title: 'Material/ReportToolbar',
};
export default meta;
type Story = StoryObj<ReportToolbarComponent>;

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
      <rpt-report-toolbar [title]="title" [rowCount]="rowCount">
        <button type="button">Export CSV</button>
      </rpt-report-toolbar>
    `,
  }),
};
