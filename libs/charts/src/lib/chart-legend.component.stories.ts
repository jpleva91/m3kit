import type { Meta, StoryObj } from '@storybook/angular';

import { ChartLegendComponent, ChartLegendItem } from './chart-legend.component';

/** Local synthetic items; lib stories must not depend on @m3kit/testing. */
const STATUS_ITEMS: readonly ChartLegendItem[] = [
  { label: 'Paid', colorIndex: 0 },
  { label: 'Sent', colorIndex: 1 },
  { label: 'Draft', colorIndex: 2 },
  { label: 'Overdue', colorIndex: 3 },
];

const meta: Meta<ChartLegendComponent> = {
  component: ChartLegendComponent,
  title: 'Molecules/ChartLegend',
};
export default meta;
type Story = StoryObj<ChartLegendComponent>;

export const Default: Story = {
  args: {
    items: STATUS_ITEMS,
  },
};

/** All six tokens plus a wrapped seventh that cycles back to token 1. */
export const WrappingPalette: Story = {
  args: {
    items: Array.from({ length: 7 }, (_, i) => ({
      label: `Series ${i + 1}`,
      colorIndex: i,
    })),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 18rem;">
        <m3k-chart-legend [items]="items" />
      </div>
    `,
  }),
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
