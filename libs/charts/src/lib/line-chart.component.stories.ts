import type { Meta, StoryObj } from '@storybook/angular';

import { LineChartComponent, LineChartSeries } from './line-chart.component';

/** Local synthetic series; lib stories must not depend on @m3kit/testing. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] as const;

const REVENUE: LineChartSeries = {
  name: 'Revenue',
  points: MONTHS.map((month, i) => ({ x: month, y: [4200, 5100, 4800, 6200, 5900, 7400][i] })),
};

const COSTS: LineChartSeries = {
  name: 'Costs',
  points: MONTHS.map((month, i) => ({ x: month, y: [3100, 3300, 3500, 3400, 3900, 4100][i] })),
};

const REFUNDS: LineChartSeries = {
  name: 'Refunds',
  points: MONTHS.map((month, i) => ({ x: month, y: [400, 250, 600, 380, 520, 300][i] })),
};

const meta: Meta<LineChartComponent> = {
  component: LineChartComponent,
  title: 'Charts/LineChart',
};
export default meta;
type Story = StoryObj<LineChartComponent>;

export const Default: Story = {
  args: {
    series: [REVENUE],
    ariaLabel: 'Revenue by month',
  },
};

export const MultiSeries: Story = {
  args: {
    series: [REVENUE, COSTS, REFUNDS],
    ariaLabel: 'Revenue, costs, and refunds by month',
  },
};

export const Area: Story = {
  args: {
    series: [REVENUE, COSTS],
    area: true,
    ariaLabel: 'Revenue and costs by month',
  },
};

/** Bare sparkline-style shape: no axes, no grid. */
export const Minimal: Story = {
  args: {
    series: [REVENUE],
    showAxes: false,
    showGrid: false,
    area: true,
    height: 120,
    ariaLabel: 'Revenue trend',
  },
};

export const NumericX: Story = {
  args: {
    series: [
      {
        name: 'Latency p95',
        points: Array.from({ length: 24 }, (_, hour) => ({
          x: hour,
          y: 180 + Math.round(90 * Math.sin(hour / 3) + hour * 4),
        })),
      },
    ],
    ariaLabel: 'p95 latency by hour',
  },
};

export const Empty: Story = {
  args: {
    series: [],
    ariaLabel: 'No data',
  },
};
