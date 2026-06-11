import { FormControl, FormGroup, Validators } from '@angular/forms';
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

export const Textarea: Story = {
  args: {
    label: 'Notes',
    type: 'textarea',
    rows: 4,
    control: new FormControl<string | null>('Customer asked for net-45 terms.'),
    hint: 'Visible on the order record.',
  },
};

export const Autocomplete: Story = {
  args: {
    label: 'Region',
    type: 'autocomplete',
    control: new FormControl<string | null>(null),
    options: [
      { value: 'north', label: 'North' },
      { value: 'south', label: 'South' },
      { value: 'east', label: 'East' },
      { value: 'west', label: 'West' },
      { value: 'southeast', label: 'Southeast' },
    ],
    hint: 'Type to filter the regions.',
  },
};

export const Chips: Story = {
  args: {
    label: 'Tags',
    type: 'chips',
    control: new FormControl<string[]>(['priority', 'wholesale'], { nonNullable: true }),
    options: [
      { value: 'priority', label: 'priority' },
      { value: 'wholesale', label: 'wholesale' },
      { value: 'fragile', label: 'fragile' },
      { value: 'export', label: 'export' },
    ],
    hint: 'Press Enter or pick a suggestion to add a tag.',
  },
};

export const Checkbox: Story = {
  args: {
    label: 'Active customers only',
    type: 'checkbox',
    control: new FormControl<boolean>(true, { nonNullable: true }),
    hint: 'Hides customers without open orders.',
  },
};

export const CheckboxRequiredError: Story = {
  args: {
    label: 'Accept the data-retention policy',
    type: 'checkbox',
    required: true,
    control: (() => {
      const control = new FormControl<boolean>(false, {
        nonNullable: true,
        validators: Validators.requiredTrue,
      });
      control.markAsTouched();
      return control;
    })(),
  },
};

export const Toggle: Story = {
  args: {
    label: 'Include archived records',
    type: 'toggle',
    control: new FormControl<boolean>(false, { nonNullable: true }),
    hint: 'Adds closed orders to the report.',
  },
};

export const Radio: Story = {
  args: {
    label: 'Priority',
    type: 'radio',
    control: new FormControl<unknown>('normal'),
    options: [
      { value: 'low', label: 'Low' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
    ],
  },
};

export const RadioRequiredError: Story = {
  args: {
    label: 'Priority',
    type: 'radio',
    required: true,
    options: [
      { value: 'low', label: 'Low' },
      { value: 'high', label: 'High' },
    ],
    control: (() => {
      const control = new FormControl<unknown>(null, Validators.required);
      control.markAsTouched();
      return control;
    })(),
  },
};

export const Slider: Story = {
  args: {
    label: 'Discount threshold',
    type: 'slider',
    min: 0,
    max: 50,
    step: 5,
    control: new FormControl<number>(15, { nonNullable: true }),
    hint: 'Percent off list price.',
  },
};

export const SliderDisabled: Story = {
  args: {
    label: 'Discount threshold',
    type: 'slider',
    min: 0,
    max: 50,
    step: 5,
    control: new FormControl<number>({ value: 25, disabled: true }, { nonNullable: true }),
    hint: 'Locked by the pricing policy.',
  },
};

export const ButtonToggle: Story = {
  args: {
    label: 'View',
    type: 'button-toggle',
    control: new FormControl<unknown>('table'),
    options: [
      { value: 'table', label: 'Table' },
      { value: 'chart', label: 'Chart' },
      { value: 'cards', label: 'Cards' },
    ],
  },
};

export const DateRange: Story = {
  args: {
    label: 'Billing period',
    type: 'date-range',
    range: new FormGroup({
      start: new FormControl<Date | null>(new Date(2026, 0, 1)),
      end: new FormControl<Date | null>(new Date(2026, 0, 31)),
    }),
    hint: 'Both dates are inclusive.',
  },
};

export const DateRangeRequiredError: Story = {
  args: {
    label: 'Billing period',
    type: 'date-range',
    required: true,
    range: (() => {
      const range = new FormGroup({
        start: new FormControl<Date | null>(null, Validators.required),
        end: new FormControl<Date | null>(null, Validators.required),
      });
      range.markAllAsTouched();
      return range;
    })(),
  },
};
