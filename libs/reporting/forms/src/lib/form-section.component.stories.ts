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
  title: 'Forms/FormSection',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [FormFieldComponent] }),
  ],
};
export default meta;
type Story = StoryObj<FormSectionComponent>;

export const Default: Story = {
  args: {
    title: 'Customer details',
    description: 'Contact and billing information for the customer record.',
  },
  render: (args) => ({
    props: {
      ...args,
      nameControl: new FormControl<string | null>('Customer 0042'),
      emailControl: new FormControl<string | null>('customer0042@example.com'),
    },
    template: `
      <rpt-form-section [title]="title" [description]="description">
        <rpt-form-field label="Customer name" type="text" [control]="nameControl" />
        <rpt-form-field label="Email" type="text" [control]="emailControl" />
      </rpt-form-section>
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
      <rpt-form-section [title]="title">
        <rpt-form-field label="Order total" type="currency" [control]="totalControl" />
      </rpt-form-section>
    `,
  }),
};
