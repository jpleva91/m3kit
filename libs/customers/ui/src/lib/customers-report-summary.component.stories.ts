import type { Meta, StoryObj } from '@storybook/angular';

import { CustomersReportSummaryComponent } from './customers-report-summary.component';

const meta: Meta<CustomersReportSummaryComponent> = {
  component: CustomersReportSummaryComponent,
  title: 'Porting/CustomersReportSummary',
};
export default meta;

type Story = StoryObj<CustomersReportSummaryComponent>;

export const PendingManualReview: Story = {
  args: {
    state: { status: 'pending-manual-review', sourceFiles: ['source.ts'], manualReviewItems: ['Write RED first'] },
  },
};
