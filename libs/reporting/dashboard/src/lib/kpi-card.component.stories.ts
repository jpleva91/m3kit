import type { Meta, StoryObj } from '@storybook/angular';

import { KpiCardComponent } from './kpi-card.component';

/** Local synthetic series; lib stories must not depend on @reporting/testing. */
const REVENUE_SPARKLINE: readonly number[] = [4200, 5100, 4800, 6200, 5900, 7400];

const meta: Meta<KpiCardComponent> = {
  component: KpiCardComponent,
  title: 'Dashboard/KpiCard',
};
export default meta;
type Story = StoryObj<KpiCardComponent>;

export const Default: Story = {
  args: {
    label: 'Open orders',
    value: 128,
  },
};

export const Currency: Story = {
  args: {
    label: 'Total revenue',
    value: 384200,
    format: 'currency',
    delta: 12,
    icon: 'payments',
  },
};

export const PercentWithDownTrend: Story = {
  args: {
    label: 'Refund rate',
    value: 0.042,
    format: 'percent',
    delta: -1.5,
    icon: 'undo',
  },
};

export const WithSparkline: Story = {
  args: {
    label: 'Monthly revenue',
    value: 7400,
    format: 'currency',
    delta: 25,
    sparkline: REVENUE_SPARKLINE,
    icon: 'trending_up',
  },
};

export const StringValue: Story = {
  args: {
    label: 'Health',
    value: 'All systems go',
    icon: 'check_circle',
  },
};

export const EdgeEmptySparkline: Story = {
  args: {
    label: 'No trend data',
    value: 0,
    format: 'number',
    delta: 0,
    sparkline: [],
  },
};
