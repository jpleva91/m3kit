import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PageHeaderComponent } from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  component: PageHeaderComponent,
  title: 'Shell/PageHeader',
  decorators: [
    applicationConfig({ providers: [provideNoopAnimations()] }),
    moduleMetadata({ imports: [MatButtonModule, MatIconModule] }),
  ],
};
export default meta;
type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {
  args: {
    title: 'Invoices',
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Customers',
    subtitle: 'Active accounts across all regions',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Support tickets',
    subtitle: 'Open queue, oldest first',
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-page-header [title]="title" [subtitle]="subtitle">
        <div m3kPageHeaderActions style="display: flex; gap: 8px;">
          <button mat-stroked-button type="button">Export</button>
          <button mat-flat-button type="button">New ticket</button>
        </div>
      </m3k-page-header>
    `,
  }),
};
