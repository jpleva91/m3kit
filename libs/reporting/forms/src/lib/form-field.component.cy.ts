import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  FormFieldComponent,
  FormFieldOption,
  FormFieldType,
} from './form-field.component';

const STATUS_OPTIONS: readonly FormFieldOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
];

@Component({
  imports: [FormFieldComponent],
  template: `
    <rpt-form-field
      [label]="label"
      [type]="type"
      [control]="control"
      [options]="options"
      [required]="required"
    />
  `,
})
class FormFieldHostComponent {
  label = 'Customer';
  type: FormFieldType = 'text';
  control = new FormControl<unknown>(null);
  options: readonly FormFieldOption[] = [];
  required = false;
}

function mountFormField(overrides: Partial<FormFieldHostComponent> = {}) {
  return cy.mount(FormFieldHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations(), provideNativeDateAdapter()],
  });
}

describe(FormFieldComponent.name, () => {
  it('renders a text input by default', () => {
    mountFormField();
    cy.get('input[matinput][type="text"][aria-label="Customer"]').should('exist');
    cy.get('mat-label').should('contain.text', 'Customer');
  });

  it('renders a number input for number fields', () => {
    mountFormField({ label: 'Quantity', type: 'number' });
    cy.get('input[type="number"][aria-label="Quantity"]').should('exist');
  });

  it('renders a decimal-stepped number input for currency fields', () => {
    mountFormField({ label: 'Amount', type: 'currency' });
    cy.get('input[type="number"][step="0.01"][aria-label="Amount"]').should('exist');
  });

  it('renders a datepicker input for date fields', () => {
    mountFormField({ label: 'Issued', type: 'date' });
    cy.get('input[aria-label="Issued"]').should('exist');
    cy.get('mat-datepicker-toggle').should('exist');
  });

  it('renders a select with the given options for select fields', () => {
    mountFormField({ label: 'Status', type: 'select', options: STATUS_OPTIONS });
    cy.get('mat-select').click();
    cy.get('mat-option').should('have.length', 3); // empty choice + 2 options
    cy.get('mat-option').last().should('contain.text', 'Sent');
  });

  it('shows the required error once the control is touched', () => {
    mountFormField({
      control: new FormControl<unknown>(null, Validators.required),
      required: true,
    });
    cy.get('mat-error').should('not.exist');
    cy.get('input[aria-label="Customer"]').focus().blur();
    cy.get('mat-error').should('contain.text', 'Customer is required.');
  });
});
