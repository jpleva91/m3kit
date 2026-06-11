import type { Meta, StoryObj } from '@storybook/angular';

import { DonutChartComponent, DonutChartSlice } from './donut-chart.component';

/** Local synthetic slices; lib stories must not depend on @m3kit/testing. */
const STATUS_SLICES: readonly DonutChartSlice[] = [
  { label: 'Paid', value: 96 },
  { label: 'Sent', value: 34 },
  { label: 'Draft', value: 18 },
  { label: 'Overdue', value: 12 },
];

const meta: Meta<DonutChartComponent> = {
  component: DonutChartComponent,
  title: 'Charts/DonutChart',
};
export default meta;
type Story = StoryObj<DonutChartComponent>;

export const Default: Story = {
  args: {
    slices: STATUS_SLICES,
    ariaLabel: 'Invoices by status',
  },
};

export const WithCenterText: Story = {
  args: {
    slices: STATUS_SLICES,
    centerValue: '160',
    centerLabel: 'Invoices',
    ariaLabel: 'Invoices by status, 160 total',
  },
};

/** Pinned token slots instead of index cycling. */
export const ExplicitColorTokens: Story = {
  args: {
    slices: [
      { label: 'Forest', value: 40, colorToken: 5 },
      { label: 'Raspberry', value: 35, colorToken: 6 },
      { label: 'Teal', value: 25, colorToken: 3 },
    ],
    centerValue: '100%',
    ariaLabel: 'Share by pinned series color',
  },
};

export const TwoSlices: Story = {
  args: {
    slices: [
      { label: 'Settled', value: 86 },
      { label: 'Outstanding', value: 14 },
    ],
    centerValue: '86%',
    centerLabel: 'Settled',
    height: 200,
    ariaLabel: 'Settled share',
  },
};

export const Empty: Story = {
  args: {
    slices: [],
    ariaLabel: 'No data',
  },
};
