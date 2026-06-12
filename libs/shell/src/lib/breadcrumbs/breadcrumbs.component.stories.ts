import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';

import { BreadcrumbsComponent } from './breadcrumbs.component';

const meta: Meta<BreadcrumbsComponent> = {
  component: BreadcrumbsComponent,
  title: 'Molecules/Breadcrumbs',
  decorators: [
    applicationConfig({
      providers: [provideRouter([], withDisabledInitialNavigation())],
    }),
  ],
};
export default meta;
type Story = StoryObj<BreadcrumbsComponent>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Reports', path: '/reports' },
      { label: 'Customers', path: '/reports/customers' },
      { label: 'Acme Manufacturing' },
    ],
  },
};

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Reports', path: '/reports' },
      { label: 'Invoices' },
    ],
  },
};

export const EdgeSingleItem: Story = {
  args: {
    items: [{ label: 'Dashboard' }],
  },
};
