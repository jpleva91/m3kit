import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { DashboardGridComponent, GridSpanDirective } from './dashboard-grid.component';
import { DetailCardComponent } from './detail-card.component';
import { KpiCardComponent } from './kpi-card.component';

const meta: Meta<DashboardGridComponent> = {
  component: DashboardGridComponent,
  title: 'Dashboard/DashboardGrid',
  decorators: [
    moduleMetadata({
      imports: [GridSpanDirective, KpiCardComponent, DetailCardComponent],
    }),
  ],
};
export default meta;
type Story = StoryObj<DashboardGridComponent>;

export const KpiRow: Story = {
  args: {
    minColumnWidth: '14rem',
    gap: '1rem',
  },
  render: (args) => ({
    props: args,
    template: `
      <rpt-dashboard-grid [minColumnWidth]="minColumnWidth" [gap]="gap">
        <rpt-kpi-card label="Total revenue" [value]="384200" format="currency" [delta]="12" icon="payments" />
        <rpt-kpi-card label="Open orders" [value]="128" format="number" [delta]="-4" icon="shopping_cart" />
        <rpt-kpi-card label="Refund rate" [value]="0.042" format="percent" icon="undo" />
        <rpt-kpi-card label="Open tickets" [value]="17" format="number" [delta]="3" icon="support_agent" />
      </rpt-dashboard-grid>
    `,
  }),
};

export const WithSpans: Story = {
  args: {
    minColumnWidth: '14rem',
    gap: '1rem',
  },
  render: (args) => ({
    props: args,
    template: `
      <rpt-dashboard-grid [minColumnWidth]="minColumnWidth" [gap]="gap">
        <rpt-kpi-card label="Total revenue" [value]="384200" format="currency" icon="payments" />
        <rpt-kpi-card label="Open orders" [value]="128" format="number" icon="shopping_cart" />
        <rpt-detail-card
          [rptGridSpan]="2"
          title="Latest invoice"
          subtitle="INV-2026-0042"
          [rows]="[
            { label: 'Customer', value: 'Customer 0117' },
            { label: 'Amount', value: '$1,250.00' },
            { label: 'Status', value: 'sent' }
          ]"
        />
        <rpt-detail-card
          rptGridSpan="full"
          title="Top product"
          [rows]="[
            { label: 'Product', value: 'Product 0007' },
            { label: 'Units sold', value: 412 }
          ]"
        />
      </rpt-dashboard-grid>
    `,
  }),
};

export const Empty: Story = {
  render: () => ({
    template: `<rpt-dashboard-grid></rpt-dashboard-grid>`,
  }),
};
