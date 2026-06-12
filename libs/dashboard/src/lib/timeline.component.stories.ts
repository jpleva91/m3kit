import type { Meta, StoryObj } from '@storybook/angular';

import { TimelineComponent, TimelineEvent } from './timeline.component';

/** Local synthetic data; lib stories must not depend on @m3kit/testing. */
const TICKET_ACTIVITY: readonly TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'Ticket created',
    timestamp: '2026-05-28 09:14',
    description: 'Customer reported a failed export on the invoices report.',
    icon: 'confirmation_number',
  },
  {
    id: 'evt-2',
    title: 'Escalated to engineering',
    timestamp: '2026-05-28 11:02',
    description: 'Export worker timing out on reports over 10k rows.',
    icon: 'priority_high',
    kind: 'warning',
  },
  {
    id: 'evt-3',
    title: 'Fix deployed',
    timestamp: '2026-05-29 16:40',
    description: 'Export worker now streams rows in batches.',
    icon: 'check_circle',
    kind: 'success',
  },
  {
    id: 'evt-4',
    title: 'Ticket closed',
    timestamp: '2026-05-30 08:05',
    icon: 'task_alt',
  },
];

const ORDER_HISTORY: readonly TimelineEvent[] = [
  { id: 'ord-1', title: 'Order ORD-20381 placed', timestamp: '2026-06-01 10:22' },
  { id: 'ord-2', title: 'Payment captured', timestamp: '2026-06-01 10:23', kind: 'success' },
  { id: 'ord-3', title: 'Picked and packed', timestamp: '2026-06-02 07:48' },
  { id: 'ord-4', title: 'Shipped via freight partner', timestamp: '2026-06-02 15:10' },
  { id: 'ord-5', title: 'Delivered', timestamp: '2026-06-05 11:31', kind: 'success' },
];

const INCIDENT_FEED: readonly TimelineEvent[] = [
  {
    id: 'inc-1',
    title: 'Nightly invoice sync started',
    timestamp: '2026-06-03 02:00',
  },
  {
    id: 'inc-2',
    title: 'Upstream rate limit hit',
    timestamp: '2026-06-03 02:14',
    description: '429 responses from the billing gateway; retrying with backoff.',
    icon: 'warning',
    kind: 'warning',
  },
  {
    id: 'inc-3',
    title: 'Sync aborted',
    timestamp: '2026-06-03 02:31',
    description: '1,204 of 8,440 invoices unsynced after the retry budget ran out.',
    icon: 'error',
    kind: 'error',
  },
  {
    id: 'inc-4',
    title: 'Manual re-run completed',
    timestamp: '2026-06-03 08:12',
    icon: 'check_circle',
    kind: 'success',
  },
];

const meta: Meta<TimelineComponent> = {
  component: TimelineComponent,
  title: 'Molecules/Timeline',
};
export default meta;
type Story = StoryObj<TimelineComponent>;

export const Default: Story = {
  args: {
    events: TICKET_ACTIVITY,
  },
};

/** Bare dots, no icons: the quietest register of the feed. */
export const DotsOnly: Story = {
  args: {
    events: ORDER_HISTORY,
  },
};

export const WithFailure: Story = {
  args: {
    events: INCIDENT_FEED,
  },
};

export const EdgeSingleEvent: Story = {
  args: {
    events: [
      {
        id: 'evt-1',
        title: 'Customer account created',
        timestamp: '2026-05-12 14:03',
        description: 'Acme Manufacturing GmbH onboarded by the EMEA sales desk.',
      },
    ],
  },
};
