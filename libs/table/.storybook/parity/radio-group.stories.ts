import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-radio-group` with a selected value,
 * a disabled option, and a fully disabled group.
 */
@Component({
  selector: 'parity-radio-groups',
  standalone: true,
  imports: [MatRadioModule, ReactiveFormsModule],
  styles: [
    ':host { display: grid; gap: 24px; max-width: 480px; } mat-radio-group { display: grid; gap: 4px; }',
  ],
  template: `
    <section>
      <h4>Invoice delivery</h4>
      <mat-radio-group [formControl]="delivery">
        <mat-radio-button value="email">Email PDF to billing contact</mat-radio-button>
        <mat-radio-button value="portal">Customer portal only</mat-radio-button>
        <mat-radio-button value="post" disabled>
          Postal mail (unavailable for this region)
        </mat-radio-button>
      </mat-radio-group>
    </section>

    <section>
      <h4>Support priority</h4>
      <mat-radio-group [formControl]="priority">
        <mat-radio-button value="low">Low — respond within 3 days</mat-radio-button>
        <mat-radio-button value="normal">Normal — respond within 1 day</mat-radio-button>
        <mat-radio-button value="urgent">Urgent — respond within 2 hours</mat-radio-button>
      </mat-radio-group>
    </section>

    <section>
      <h4>Billing cycle (locked by contract)</h4>
      <mat-radio-group [formControl]="cycle">
        <mat-radio-button value="monthly">Monthly</mat-radio-button>
        <mat-radio-button value="quarterly">Quarterly</mat-radio-button>
        <mat-radio-button value="annual">Annual</mat-radio-button>
      </mat-radio-group>
    </section>
  `,
})
class RadioGroupsComponent {
  readonly delivery = new FormControl('email');
  readonly priority = new FormControl('urgent');
  readonly cycle = new FormControl({ value: 'quarterly', disabled: true });
}

const meta: Meta = {
  title: 'Material Parity/RadioGroup',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [RadioGroupsComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

export const OrderPreferences: Story = {
  render: () => ({ template: '<parity-radio-groups />' }),
};
