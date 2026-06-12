import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { TableDefinition } from '@m3kit/core';

import { TableFilterBarComponent } from './table-filter-bar.component';

interface SupportTicketRow {
  readonly id: number;
  readonly subject: string;
  readonly status: string;
}

const TICKET_DEFINITION: TableDefinition<SupportTicketRow> = {
  id: 'support-tickets',
  title: 'Support Tickets',
  columns: [
    { key: 'id', header: 'Ticket', type: 'number' },
    { key: 'subject', header: 'Subject', type: 'text', filterable: true },
    { key: 'status', header: 'Status', type: 'badge' },
  ],
};

const meta: Meta<TableFilterBarComponent<SupportTicketRow>> = {
  component: TableFilterBarComponent,
  title: 'Molecules/TableFilterBar',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<TableFilterBarComponent<SupportTicketRow>>;

export const Default: Story = {
  args: {
    definition: TICKET_DEFINITION,
  },
};
