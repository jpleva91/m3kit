import { FormControl } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import { FormFieldComponent } from './form-field.component';
import { FormSectionComponent } from './form-section.component';

const meta: Meta<FormSectionComponent> = {
  component: FormSectionComponent,
  title: 'Molecules/FormSection',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [FormFieldComponent] }),
  ],
  argTypes: {
    headingLevel: { control: 'inline-radio', options: [2, 3, 4] },
  },
};
export default meta;
type Story = StoryObj<FormSectionComponent>;

export const Default: Story = {
  args: {
    title: 'Customer details',
    description: 'Contact and billing information for the customer record.',
    headingLevel: 3,
  },
  render: (args) => ({
    props: {
      ...args,
      nameControl: new FormControl<string | null>('Customer 0042'),
      emailControl: new FormControl<string | null>('customer0042@example.com'),
    },
    template: `
      <m3k-form-section [title]="title" [description]="description" [headingLevel]="headingLevel">
        <m3k-form-field label="Customer name" type="text" [control]="nameControl" />
        <m3k-form-field label="Email" type="text" [control]="emailControl" />
      </m3k-form-section>
    `,
  }),
};

export const WithoutDescription: Story = {
  args: {
    title: 'Order summary',
  },
  render: (args) => ({
    props: {
      ...args,
      totalControl: new FormControl<number | null>(420),
    },
    template: `
      <m3k-form-section [title]="title">
        <m3k-form-field label="Order total" type="currency" [control]="totalControl" />
      </m3k-form-section>
    `,
  }),
};
