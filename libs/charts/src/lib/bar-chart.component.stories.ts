import type { Meta, StoryObj } from '@storybook/angular';

import { BarChartComponent, BarChartSeries } from './bar-chart.component';

/** Local synthetic series; lib stories must not depend on @m3kit/testing. */
const QUARTERS: readonly string[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const SERIES: readonly BarChartSeries[] = [
  { name: 'Paid', values: [96, 104, 88, 121] },
  { name: 'Sent', values: [34, 28, 41, 30] },
  { name: 'Overdue', values: [12, 9, 17, 8] },
];

const meta: Meta<BarChartComponent> = {
  component: BarChartComponent,
  title: 'Charts/BarChart',
};
export default meta;
type Story = StoryObj<BarChartComponent>;

export const Default: Story = {
  args: {
    categories: QUARTERS,
    series: [SERIES[0]],
    ariaLabel: 'Paid invoices by quarter',
  },
};

export const Grouped: Story = {
  args: {
    categories: QUARTERS,
    series: SERIES,
    mode: 'grouped',
    ariaLabel: 'Invoices by status and quarter',
  },
};

export const Stacked: Story = {
  args: {
    categories: QUARTERS,
    series: SERIES,
    mode: 'stacked',
    ariaLabel: 'Invoices by status and quarter, stacked',
  },
};

export const Horizontal: Story = {
  args: {
    categories: ['Hardware', 'Software', 'Services', 'Support'],
    series: [{ name: 'Revenue', values: [48200, 91400, 33800, 21500] }],
    horizontal: true,
    ariaLabel: 'Revenue by product line',
  },
};

export const HorizontalStacked: Story = {
  args: {
    categories: ['Hardware', 'Software', 'Services'],
    series: SERIES.map((s) => ({ name: s.name, values: s.values.slice(0, 3) })),
    mode: 'stacked',
    horizontal: true,
    ariaLabel: 'Invoices by status and product line, stacked',
  },
};

export const Empty: Story = {
  args: {
    categories: [],
    series: [],
    ariaLabel: 'No data',
  },
};
