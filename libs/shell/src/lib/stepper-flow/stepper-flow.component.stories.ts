import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  StepperFlowComponent,
  StepperFlowFooterExtrasDirective,
  StepperFlowPanelDirective,
} from './stepper-flow.component';
import { StepDefinition } from './stepper-flow-model';

/**
 * Order-entry flow over the approved synthetic domain: the consumer marks
 * steps `completed` as its forms validate (pre-filled here), and the footer
 * gates Next/Finish in linear mode.
 */
const ORDER_STEPS: readonly StepDefinition[] = [
  { id: 'customer', label: 'Customer', completed: true },
  { id: 'items', label: 'Line items', completed: true },
  { id: 'review', label: 'Review & submit', completed: true },
];

const CUSTOMER_PANEL = `
  <ng-template m3kStepPanel="customer">
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 360px;">
      <mat-form-field appearance="outline">
        <mat-label>Company</mat-label>
        <input matInput value="Cascade Outfitters" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Billing email</mat-label>
        <input matInput type="email" value="accounts&#64;cascade-outfitters.example" />
        <mat-hint>Order confirmations and invoices go here</mat-hint>
      </mat-form-field>
    </div>
  </ng-template>
`;

const ITEMS_PANEL = `
  <ng-template m3kStepPanel="items">
    <ul
      style="margin: 0; padding: 0; list-style: none; max-width: 420px;
             font-family: var(--app-font-data); font-size: 13px;
             color: var(--mat-sys-on-surface);"
    >
      <li style="display: flex; justify-content: space-between; padding: 8px 0;
                 border-bottom: 1px solid var(--mat-sys-outline-variant);">
        <span>SKU-2041 · Trail shelter, 2P</span><span>2 × $289.00</span>
      </li>
      <li style="display: flex; justify-content: space-between; padding: 8px 0;
                 border-bottom: 1px solid var(--mat-sys-outline-variant);">
        <span>SKU-1188 · Titanium stove kit</span><span>4 × $64.50</span>
      </li>
      <li style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span>SKU-0930 · Guyline spool, 30 m</span><span>12 × $7.25</span>
      </li>
    </ul>
  </ng-template>
`;

const REVIEW_PANEL = `
  <ng-template m3kStepPanel="review" let-step>
    <dl
      style="margin: 0; display: grid; grid-template-columns: auto 1fr;
             gap: 4px 24px; max-width: 420px; font: var(--mat-sys-body-medium);
             color: var(--mat-sys-on-surface);"
    >
      <dt style="color: var(--mat-sys-on-surface-variant);">Customer</dt>
      <dd style="margin: 0;">Cascade Outfitters</dd>
      <dt style="color: var(--mat-sys-on-surface-variant);">Items</dt>
      <dd style="margin: 0;">3 lines · 18 units</dd>
      <dt style="color: var(--mat-sys-on-surface-variant);">Total</dt>
      <dd style="margin: 0; font-family: var(--app-font-data);">$923.00</dd>
    </dl>
  </ng-template>
`;

const NOTES_PANEL = `
  <ng-template m3kStepPanel="notes">
    <mat-form-field appearance="outline" style="max-width: 420px; width: 100%;">
      <mat-label>Delivery notes</mat-label>
      <textarea matInput rows="3" placeholder="Dock B, weekdays before 3pm"></textarea>
      <mat-hint>Optional — skip if the default dock applies</mat-hint>
    </mat-form-field>
  </ng-template>
`;

const meta: Meta<StepperFlowComponent> = {
  component: StepperFlowComponent,
  title: 'Templates/StepperFlow',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({
      imports: [
        StepperFlowPanelDirective,
        StepperFlowFooterExtrasDirective,
        MatFormFieldModule,
        MatInputModule,
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<StepperFlowComponent>;

export const OrderEntry: Story = {
  args: {
    steps: ORDER_STEPS,
    orientation: 'horizontal',
    linear: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-stepper-flow [steps]="steps" [orientation]="orientation" [linear]="linear">
        ${CUSTOMER_PANEL}
        ${ITEMS_PANEL}
        ${REVIEW_PANEL}
        <ng-template m3kStepperFooterExtras>
          <span>Draft ORD-10421 · saved 2 min ago</span>
        </ng-template>
      </m3k-stepper-flow>
    `,
  }),
};

export const Vertical: Story = {
  args: {
    steps: ORDER_STEPS,
    orientation: 'vertical',
    linear: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-stepper-flow [steps]="steps" [orientation]="orientation" [linear]="linear">
        ${CUSTOMER_PANEL}
        ${ITEMS_PANEL}
        ${REVIEW_PANEL}
      </m3k-stepper-flow>
    `,
  }),
};

export const OptionalStep: Story = {
  args: {
    steps: [
      { id: 'customer', label: 'Customer', completed: true },
      { id: 'items', label: 'Line items', completed: true },
      { id: 'notes', label: 'Delivery notes', optional: true },
      { id: 'review', label: 'Review & submit', completed: true },
    ],
    orientation: 'horizontal',
    linear: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <m3k-stepper-flow [steps]="steps" [orientation]="orientation" [linear]="linear">
        ${CUSTOMER_PANEL}
        ${ITEMS_PANEL}
        ${NOTES_PANEL}
        ${REVIEW_PANEL}
      </m3k-stepper-flow>
    `,
  }),
};
