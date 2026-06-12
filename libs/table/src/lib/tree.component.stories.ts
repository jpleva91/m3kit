import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

import { TreeComponent, TreeNode } from './tree.component';

/**
 * Report-library hierarchy: saved report definitions filed by domain, the
 * way a reporting workspace's sidebar would organize them.
 */
const REPORT_LIBRARY: readonly TreeNode[] = [
  {
    id: 'orders',
    label: 'Orders',
    icon: 'folder',
    children: [
      { id: 'orders-open', label: 'Open orders', icon: 'table_chart' },
      { id: 'orders-backlog', label: 'Fulfillment backlog', icon: 'table_chart' },
      {
        id: 'orders-archive',
        label: 'Archive',
        icon: 'folder',
        children: [
          { id: 'orders-2025', label: 'Orders 2025', icon: 'table_chart' },
          { id: 'orders-2024', label: 'Orders 2024', icon: 'table_chart' },
        ],
      },
    ],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: 'folder',
    children: [
      { id: 'invoices-overdue', label: 'Overdue invoices', icon: 'table_chart' },
      { id: 'invoices-paid', label: 'Paid this quarter', icon: 'table_chart' },
    ],
  },
  {
    id: 'support',
    label: 'Support tickets',
    icon: 'folder',
    children: [
      { id: 'support-open', label: 'Open tickets', icon: 'table_chart' },
      { id: 'support-escalations', label: 'Escalations', icon: 'table_chart' },
    ],
  },
  { id: 'getting-started', label: 'Getting started', icon: 'description' },
];

/** Product-category taxonomy nested five levels deep. */
const DEEP_CATEGORIES: readonly TreeNode[] = [
  {
    id: 'catalog',
    label: 'Product catalog',
    icon: 'folder',
    children: [
      {
        id: 'hardware',
        label: 'Hardware',
        icon: 'folder',
        children: [
          {
            id: 'scanners',
            label: 'Scanners',
            icon: 'folder',
            children: [
              {
                id: 'desk-scanners',
                label: 'Desk scanners',
                icon: 'folder',
                children: [
                  { id: 'scanner-s2', label: 'Desk scanner S2', icon: 'table_chart' },
                  { id: 'scanner-s3', label: 'Desk scanner S3', icon: 'table_chart' },
                ],
              },
              { id: 'mobile-scanners', label: 'Mobile scanners', icon: 'folder' },
            ],
          },
          { id: 'label-printers', label: 'Label printers', icon: 'table_chart' },
        ],
      },
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        icon: 'folder',
        children: [
          { id: 'support-retainer', label: 'Support retainer', icon: 'table_chart' },
          { id: 'analytics-addon', label: 'Analytics add-on', icon: 'table_chart' },
        ],
      },
    ],
  },
];

const meta: Meta<TreeComponent> = {
  component: TreeComponent,
  title: 'Organisms/Tree',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<TreeComponent>;

export const ReportLibrary: Story = {
  args: {
    nodes: REPORT_LIBRARY,
    expandedIds: ['orders'],
  },
};

export const Selectable: Story = {
  args: {
    nodes: REPORT_LIBRARY,
    expandedIds: ['orders', 'invoices'],
    selectable: true,
    selectedId: 'invoices-overdue',
  },
};

export const DeepNesting: Story = {
  args: {
    nodes: DEEP_CATEGORIES,
    expandedIds: ['catalog', 'hardware', 'scanners', 'desk-scanners'],
  },
};
