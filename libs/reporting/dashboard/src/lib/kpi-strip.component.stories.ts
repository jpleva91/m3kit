import type { Meta, StoryObj } from '@storybook/angular';

import { KpiStripComponent, KpiStripItem } from './kpi-strip.component';

/** Local synthetic series; lib stories must not depend on @m3kit/testing. */
const REVENUE_SPARKLINE: readonly number[] = [4200, 5100, 4800, 6200, 5900, 7400];

const ITEMS: readonly KpiStripItem[] = [
  { label: 'Total revenue', value: 1284902.44, format: 'currency', delta: 4.2 },
  { label: 'Open invoices', value: 38, format: 'number', delta: 6 },
  { label: 'Overdue', value: 12, format: 'number', delta: -3 },
  { label: 'Open tickets', value: 17, format: 'number', delta: 2 },
];

const meta: Meta<KpiStripComponent> = {
  component: KpiStripComponent,
  title: 'Dashboard/KpiStrip',
};
export default meta;
type Story = StoryObj<KpiStripComponent>;

export const Populated: Story = {
  args: {
    items: ITEMS,
  },
};

export const WithSparkline: Story = {
  args: {
    items: [
      {
        label: 'Total revenue',
        value: 1284902.44,
        format: 'currency',
        delta: 4.2,
        sparkline: REVENUE_SPARKLINE,
      },
      ...ITEMS.slice(1),
    ],
  },
};

/** Readouts wrap into rows once the strip runs out of width. */
export const Narrow: Story = {
  args: {
    items: ITEMS,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 24rem;">
        <rpt-kpi-strip [items]="items" />
      </div>
    `,
  }),
};
