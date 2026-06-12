import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

const CUSTOMERS = [
  'Halvorsen Logistics A/S',
  'Harbor & Pine Outfitters',
  'Helix Manufacturing Co.',
  'Meridian Freight Lines',
  'Mercury Office Supply',
  'Northwind Analytics',
  'Oakfield Provisioning',
  'Osprey Field Services',
];

/**
 * Material parity gallery: raw `mat-autocomplete` on a plain `matInput`,
 * filtering a synthetic customer roster as the user types.
 */
@Component({
  selector: 'parity-autocomplete',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Customer</mat-label>
      <input
        matInput
        [formControl]="customer"
        [matAutocomplete]="customerAuto"
        placeholder="Start typing a customer name"
      />
      <mat-hint>Matches against the customer roster.</mat-hint>
      <mat-autocomplete #customerAuto="matAutocomplete">
        @for (name of filteredCustomers(); track name) {
          <mat-option [value]="name">{{ name }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Support agent</mat-label>
      <input matInput [formControl]="agent" [matAutocomplete]="agentAuto" />
      <mat-autocomplete #agentAuto="matAutocomplete">
        @for (name of agents; track name) {
          <mat-option [value]="name">{{ name }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
})
class AutocompleteComponent {
  readonly customer = new FormControl('He');
  readonly agent = new FormControl('Priya Raman');
  readonly agents = ['Priya Raman', 'Jonas Lindqvist', 'Mara Okafor', 'Sam Whitfield'];

  private readonly customerValue = toSignal(this.customer.valueChanges, {
    initialValue: this.customer.value,
  });

  filteredCustomers(): readonly string[] {
    const query = (this.customerValue() ?? '').toLowerCase();
    return CUSTOMERS.filter((name) => name.toLowerCase().includes(query));
  }
}

const meta: Meta<AutocompleteComponent> = {
  component: AutocompleteComponent,
  title: 'Atoms/Autocomplete',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [AutocompleteComponent] }),
  ],
};
export default meta;
type Story = StoryObj<AutocompleteComponent>;

export const CustomerSearch: Story = {
  render: () => ({ template: '<parity-autocomplete />' }),
};
