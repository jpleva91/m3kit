import { FormControl, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

import { FormFieldComponent } from './form-field.component';

const meta: Meta<FormFieldComponent> = {
  component: FormFieldComponent,
  title: 'Forms/FormField',
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideNativeDateAdapter()] }),
  ],
};
export default meta;
type Story = StoryObj<FormFieldComponent>;

export const Text: Story = {
  args: {
    label: 'Customer name',
    type: 'text',
    control: new FormControl<string | null>('Customer 0042'),
    hint: 'Exact match against the customer column.',
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Quantity',
    type: 'number',
    control: new FormControl<number | null>(3),
  },
};

export const Currency: Story = {
  args: {
    label: 'Order total',
    type: 'currency',
    control: new FormControl<number | null>(149.5),
    hint: 'USD',
  },
};

export const DatePicker: Story = {
  args: {
    label: 'Placed on',
    type: 'date',
    control: new FormControl<Date | null>(new Date(2026, 0, 15)),
  },
};

export const Select: Story = {
  args: {
    label: 'Ticket status',
    type: 'select',
    control: new FormControl<unknown>('open'),
    options: [
      { value: 'open', label: 'Open' },
      { value: 'in-progress', label: 'In progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'closed', label: 'Closed' },
    ],
  },
};

export const RequiredError: Story = {
  args: {
    label: 'Customer name',
    type: 'text',
    required: true,
    control: (() => {
      const control = new FormControl<string | null>(null, Validators.required);
      control.markAsTouched();
      return control;
    })(),
  },
};

export const MinMaxErrors: Story = {
  args: {
    label: 'Quantity',
    type: 'number',
    hint: 'Between 1 and 100.',
    control: (() => {
      const control = new FormControl<number | null>(250, [
        Validators.min(1),
        Validators.max(100),
      ]);
      control.markAsTouched();
      return control;
    })(),
  },
};
