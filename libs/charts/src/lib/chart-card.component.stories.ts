import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { ChartCardComponent } from './chart-card.component';
import { ChartLegendComponent } from './chart-legend.component';
import { DonutChartComponent } from './donut-chart.component';
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

const meta: Meta<ChartCardComponent> = {
  component: ChartCardComponent,
  title: 'Organisms/ChartCard',
  decorators: [
    moduleMetadata({
      imports: [ChartLegendComponent, DonutChartComponent, LineChartComponent],
    }),
  ],
};
export default meta;
type Story = StoryObj<ChartCardComponent>;

export const Default: Story = {
  args: {
    title: 'Revenue',
    subtitle: 'Last 6 months',
  },
  render: (args) => ({
    props: { ...args, series: [REVENUE] },
    template: `
      <m3k-chart-card [title]="title" [subtitle]="subtitle">
        <m3k-line-chart [series]="series" [area]="true" ariaLabel="Revenue by month" />
      </m3k-chart-card>
    `,
  }),
};

export const WithLegend: Story = {
  args: {
    title: 'Revenue vs costs',
    subtitle: 'Last 6 months',
  },
  render: (args) => ({
    props: {
      ...args,
      series: [REVENUE, COSTS],
      legend: [
        { label: 'Revenue', colorIndex: 0 },
        { label: 'Costs', colorIndex: 1 },
      ],
    },
    template: `
      <m3k-chart-card [title]="title" [subtitle]="subtitle">
        <m3k-line-chart [series]="series" ariaLabel="Revenue and costs by month" />
        <m3k-chart-legend m3kChartCardLegend [items]="legend" />
      </m3k-chart-card>
    `,
  }),
};

export const WithDonut: Story = {
  args: {
    title: 'Invoices by status',
  },
  render: (args) => ({
    props: {
      ...args,
      slices: [
        { label: 'Paid', value: 96 },
        { label: 'Sent', value: 34 },
        { label: 'Overdue', value: 12 },
      ],
      legend: [
        { label: 'Paid', colorIndex: 0 },
        { label: 'Sent', colorIndex: 1 },
        { label: 'Overdue', colorIndex: 2 },
      ],
    },
    template: `
      <div style="max-width: 24rem;">
        <m3k-chart-card [title]="title">
          <m3k-donut-chart
            [slices]="slices"
            centerValue="142"
            centerLabel="Invoices"
            ariaLabel="Invoices by status"
          />
          <m3k-chart-legend m3kChartCardLegend [items]="legend" />
        </m3k-chart-card>
      </div>
    `,
  }),
};

export const Loading: Story = {
  args: {
    title: 'Revenue',
    subtitle: 'Last 6 months',
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    title: 'Revenue',
    empty: true,
    emptyMessage: 'Nothing invoiced yet.',
  },
};
