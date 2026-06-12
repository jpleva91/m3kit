import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  DateRangeGroup,
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
    <m3k-form-field
      [label]="label"
      [type]="type"
      [control]="control"
      [range]="range"
      [options]="options"
      [required]="required"
      [rows]="rows"
      [min]="min"
      [max]="max"
      [step]="step"
    />
  `,
})
class FormFieldHostComponent {
  label = 'Customer';
  type: FormFieldType = 'text';
  control: FormControl<unknown> | undefined = new FormControl<unknown>(null);
  range: DateRangeGroup | undefined = undefined;
  options: readonly FormFieldOption[] = [];
  required = false;
  rows = 3;
  min = 0;
  max = 100;
  step = 1;
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
    cy.get('mat-option').first().should('have.attr', 'aria-label', 'No filter');
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

  it('renders a textarea with the given rows and writes typed text through', () => {
    const control = new FormControl<unknown>(null);
    mountFormField({ label: 'Notes', type: 'textarea', rows: 5, control });
    cy.get('textarea[aria-label="Notes"]')
      .should('have.attr', 'rows', '5')
      .type('Net-45 terms.')
      .then(() => {
        expect(control.value).to.equal('Net-45 terms.');
      });
  });

  it('filters autocomplete options and writes the picked value through', () => {
    const control = new FormControl<unknown>(null);
    mountFormField({
      label: 'Status',
      type: 'autocomplete',
      control,
      options: STATUS_OPTIONS,
    });
    cy.get('input[aria-label="Status"]').type('se');
    cy.get('mat-option').should('have.length', 1).first().click();
    cy.get('input[aria-label="Status"]')
      .should('have.value', 'Sent')
      .then(() => {
        expect(control.value).to.equal('sent');
      });
  });

  it('adds and removes chips on a chips field', () => {
    const control = new FormControl<string[]>(['alpha'], { nonNullable: true });
    mountFormField({
      label: 'Tags',
      type: 'chips',
      control: control as unknown as FormControl<unknown>,
    });
    cy.get('mat-chip-row').should('have.length', 1);

    cy.get('input.mat-mdc-chip-input').type('beta{enter}');
    cy.get('mat-chip-row')
      .should('have.length', 2)
      .then(() => {
        expect(control.value).to.deep.equal(['alpha', 'beta']);
      });

    cy.get('mat-chip-row').first().find('[matchipremove]').click();
    cy.get('mat-chip-row')
      .should('have.length', 1)
      .then(() => {
        expect(control.value).to.deep.equal(['beta']);
      });
  });

  it('checks a checkbox field and writes through the control', () => {
    const control = new FormControl<boolean>(false, { nonNullable: true });
    mountFormField({
      label: 'Active only',
      type: 'checkbox',
      control: control as unknown as FormControl<unknown>,
    });
    cy.get('mat-checkbox input').click();
    cy.get('mat-checkbox input')
      .should('be.checked')
      .then(() => {
        expect(control.value).to.equal(true);
      });
  });

  it('flips a slide toggle and writes through the control', () => {
    const control = new FormControl<boolean>(false, { nonNullable: true });
    mountFormField({
      label: 'Include archived',
      type: 'toggle',
      control: control as unknown as FormControl<unknown>,
    });
    cy.get('mat-slide-toggle button').click();
    cy.get('mat-slide-toggle button')
      .should('have.attr', 'aria-checked', 'true')
      .then(() => {
        expect(control.value).to.equal(true);
      });
  });

  it('picks a radio option and writes through the control', () => {
    const control = new FormControl<unknown>(null);
    mountFormField({
      label: 'Priority',
      type: 'radio',
      control,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'high', label: 'High' },
      ],
    });
    cy.get('mat-radio-button').contains('High').click();
    cy.get('input[type="radio"]')
      .last()
      .should('be.checked')
      .then(() => {
        expect(control.value).to.equal('high');
      });
  });

  it('slides the slider thumb and writes through the control', () => {
    const control = new FormControl<number>(20, { nonNullable: true });
    mountFormField({
      label: 'Threshold',
      type: 'slider',
      min: 0,
      max: 50,
      step: 5,
      control: control as unknown as FormControl<unknown>,
    });
    // Synthetic keystrokes do not move a native range input, so slide by
    // writing the value and firing the events the slider listens to.
    cy.get('input[matsliderthumb]')
      .invoke('val', 25)
      .trigger('input')
      .trigger('change')
      .then(() => {
        expect(control.value).to.equal(25);
      });
  });

  it('selects a segment of a button-toggle group and writes through the control', () => {
    const control = new FormControl<unknown>('draft');
    mountFormField({
      label: 'Status',
      type: 'button-toggle',
      control,
      options: STATUS_OPTIONS,
    });
    cy.get('mat-button-toggle').contains('Sent').click();
    cy.get('mat-button-toggle')
      .last()
      .should('have.class', 'mat-button-toggle-checked')
      .then(() => {
        expect(control.value).to.equal('sent');
      });
  });

  it('picks a start and end date on a date-range field', () => {
    const range = new FormGroup({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });
    mountFormField({ label: 'Billing period', type: 'date-range', range });
    cy.get('mat-datepicker-toggle button').click();
    cy.contains('.mat-calendar-body-cell-content', /^\s*15\s*$/).click();
    cy.contains('.mat-calendar-body-cell-content', /^\s*20\s*$/).click();
    cy.get('.mat-datepicker-content').should('not.exist');
    cy.then(() => {
      expect(range.controls.start.value?.getDate()).to.equal(15);
      expect(range.controls.end.value?.getDate()).to.equal(20);
    });
  });
});
