import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { ReportDefinition } from '@reporting/core';

import { ReportFilterBarComponent } from './report-filter-bar.component';

interface SupportTicketRow {
  readonly id: number;
  readonly subject: string;
  readonly status: string;
}

const TICKET_DEFINITION: ReportDefinition<SupportTicketRow> = {
  id: 'support-tickets',
  title: 'Support Tickets',
  columns: [
    { key: 'id', header: 'Ticket', type: 'number' },
    { key: 'subject', header: 'Subject', type: 'text', filterable: true },
    { key: 'status', header: 'Status', type: 'badge' },
  ],
};

const meta: Meta<ReportFilterBarComponent<SupportTicketRow>> = {
  component: ReportFilterBarComponent,
  title: 'Material/ReportFilterBar',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ReportFilterBarComponent<SupportTicketRow>>;

export const Default: Story = {
  args: {
    definition: TICKET_DEFINITION,
  },
};
