import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { userEvent, within } from '@storybook/test';
import { provideAnimations } from '@angular/platform-browser/animations';

import { MenuActionItem } from './overflow-menu-model';
import { OverflowMenuComponent } from './overflow-menu.component';

/** Row actions for one invoice — a destructive + disabled mix. */
const INVOICE_ROW_ACTIONS: readonly MenuActionItem[] = [
  { id: 'view', label: 'View invoice', icon: 'visibility' },
  { id: 'duplicate', label: 'Duplicate as draft', icon: 'content_copy' },
  { id: 'record-payment', label: 'Record payment', icon: 'payments', disabled: true },
  { id: 'void', label: 'Void invoice', icon: 'block', destructive: true, divider: true },
];

/** Icon-less customer row actions — labels carry the menu alone. */
const CUSTOMER_ROW_ACTIONS: readonly MenuActionItem[] = [
  { id: 'open', label: 'Open customer' },
  { id: 'edit', label: 'Edit details' },
  { id: 'statement', label: 'Download statement' },
  { id: 'archive', label: 'Archive customer', destructive: true, divider: true },
];

/** A long support-ticket menu — sections split by dividers. */
const TICKET_ACTIONS: readonly MenuActionItem[] = [
  { id: 'open', label: 'Open ticket', icon: 'open_in_new' },
  { id: 'assign-me', label: 'Assign to me', icon: 'person' },
  { id: 'assign-team', label: 'Assign to team', icon: 'group' },
  { id: 'priority-high', label: 'Set priority: high', icon: 'priority_high', divider: true },
  { id: 'priority-normal', label: 'Set priority: normal', icon: 'low_priority' },
  { id: 'link-order', label: 'Link to order', icon: 'link' },
  { id: 'merge', label: 'Merge into another ticket', icon: 'call_merge' },
  { id: 'escalate', label: 'Escalate to engineering', icon: 'trending_up', divider: true },
  { id: 'close', label: 'Close ticket', icon: 'check_circle' },
  { id: 'delete', label: 'Delete ticket', icon: 'delete', destructive: true, divider: true },
];

const meta: Meta<OverflowMenuComponent> = {
  component: OverflowMenuComponent,
  title: 'Molecules/OverflowMenu',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  render: (args) => ({
    props: args,
    // Padded stage so the opened menu has room inside the story iframe.
    template: `
      <div style="min-height: 320px; padding: 16px;">
        <m3k-overflow-menu
          [items]="items"
          [icon]="icon"
          [ariaLabel]="ariaLabel"
          [disabled]="disabled"
        />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<OverflowMenuComponent>;

export const InvoiceRowActions: Story = {
  args: {
    items: INVOICE_ROW_ACTIONS,
    ariaLabel: 'Invoice INV-2026-0042 actions',
  },
  // Open the menu so the destructive/disabled/divider mix is visible.
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Invoice INV-2026-0042 actions',
    });
    await userEvent.click(trigger);
  },
};

export const IconLess: Story = {
  args: {
    items: CUSTOMER_ROW_ACTIONS,
    ariaLabel: 'Customer Acme Manufacturing actions',
  },
};

export const LongMenu: Story = {
  args: {
    items: TICKET_ACTIONS,
    ariaLabel: 'Ticket TCK-1873 actions',
  },
};

export const DisabledTrigger: Story = {
  args: {
    items: INVOICE_ROW_ACTIONS,
    ariaLabel: 'Invoice INV-2026-0042 actions',
    disabled: true,
  },
};
