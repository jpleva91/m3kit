import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { FormFieldComponent, FormFieldOption, FormFieldType } from './form-field.component';

@Component({
  imports: [FormFieldComponent],
  template: `
    <rpt-form-field
      [label]="label"
      [control]="control"
      [type]="type"
      [options]="options"
      [hint]="hint"
      [required]="required"
    />
  `,
})
class HostComponent {
  label = 'Amount';
  control: FormControl<unknown> = new FormControl<number | null>(null);
  type: FormFieldType = 'number';
  options: readonly FormFieldOption[] = [];
  hint = '';
  required = false;
}

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders the label and a number input for number fields', () => {
    fixture.detectChanges();

    expect(element.textContent).toContain('Amount');
    const input = element.querySelector('input[type="number"]');
    expect(input).not.toBeNull();
  });

  it('renders a text input for text fields and writes through the control', () => {
    host.label = 'Customer';
    host.type = 'text';
    host.control = new FormControl<string | null>(null);
    fixture.detectChanges();

    const input = element.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = 'Customer 0042';
    input.dispatchEvent(new Event('input'));

    expect(host.control.value).toBe('Customer 0042');
  });

  it('renders a decimal number input for currency fields', () => {
    host.type = 'currency';
    fixture.detectChanges();

    const input = element.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input.step).toBe('0.01');
  });

  it('renders a datepicker input for date fields', () => {
    host.label = 'Issued';
    host.type = 'date';
    host.control = new FormControl<Date | null>(null);
    fixture.detectChanges();

    // MatDatepickerInput marks its input as a dialog trigger.
    expect(element.querySelector('input[aria-haspopup="dialog"]')).not.toBeNull();
    expect(element.querySelector('mat-datepicker-toggle')).not.toBeNull();
  });

  it('renders a select with the given options for select fields', () => {
    host.label = 'Status';
    host.type = 'select';
    host.options = [
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
    ];
    host.control = new FormControl<unknown>(null);
    fixture.detectChanges();

    const select = element.querySelector('mat-select') as HTMLElement;
    expect(select).not.toBeNull();

    select.click();
    fixture.detectChanges();

    const options = Array.from(document.querySelectorAll('mat-option')).map(
      (option) => option.textContent?.trim(),
    );
    expect(options).toEqual(['—', 'Paid', 'Overdue']);
  });

  it('shows the hint when provided', () => {
    host.hint = 'Whole dollars only';
    fixture.detectChanges();

    expect(element.querySelector('mat-hint')?.textContent).toContain('Whole dollars only');
  });

  it('shows a required error once the control is touched', () => {
    host.label = 'Customer';
    host.type = 'text';
    host.required = true;
    host.control = new FormControl<string | null>(null, Validators.required);
    fixture.detectChanges();

    expect(element.querySelector('mat-error')).toBeNull();

    host.control.markAsTouched();
    fixture.detectChanges();

    expect(element.querySelector('mat-error')?.textContent).toContain(
      'Customer is required.',
    );
  });

  it('shows min and max errors with their bounds', () => {
    host.control = new FormControl<number | null>(null, [
      Validators.min(10),
      Validators.max(500),
    ]);
    fixture.detectChanges();

    host.control.setValue(3);
    host.control.markAsTouched();
    fixture.detectChanges();
    expect(element.querySelector('mat-error')?.textContent).toContain(
      'Amount must be at least 10.',
    );

    host.control.setValue(9000);
    fixture.detectChanges();
    expect(element.querySelector('mat-error')?.textContent).toContain(
      'Amount must be at most 500.',
    );
  });
});
