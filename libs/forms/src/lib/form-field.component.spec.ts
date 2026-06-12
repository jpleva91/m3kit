import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  DateRangeGroup,
  FormFieldComponent,
  FormFieldOption,
  FormFieldType,
} from './form-field.component';

@Component({
  imports: [FormFieldComponent],
  template: `
    <m3k-form-field
      [label]="label"
      [control]="control"
      [range]="range"
      [type]="type"
      [options]="options"
      [hint]="hint"
      [required]="required"
      [rows]="rows"
      [min]="min"
      [max]="max"
      [step]="step"
    />
  `,
})
class HostComponent {
  label = 'Amount';
  control: FormControl<unknown> | undefined = new FormControl<number | null>(null);
  range: DateRangeGroup | undefined = undefined;
  type: FormFieldType = 'number';
  options: readonly FormFieldOption[] = [];
  hint = '';
  required = false;
  rows = 3;
  min = 0;
  max = 100;
  step = 1;
}

/** Keydown event carrying the legacy `keyCode` Material chips reads. */
function enterKeydown(): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Enter' });
  Object.defineProperty(event, 'keyCode', { get: () => 13 });
  return event;
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

    // The visual-dash clear option carries a real accessible name.
    const clearOption = document.querySelector('mat-option');
    expect(clearOption?.getAttribute('aria-label')).toBe('No filter');
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

  it('renders a textarea with the given rows and writes through the control', () => {
    host.label = 'Notes';
    host.type = 'textarea';
    host.rows = 5;
    host.control = new FormControl<string | null>(null);
    fixture.detectChanges();

    const textarea = element.querySelector('textarea[matinput]') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.rows).toBe(5);

    textarea.value = 'Ship with care.';
    textarea.dispatchEvent(new Event('input'));
    expect(host.control?.value).toBe('Ship with care.');
  });

  it('filters autocomplete options against the typed text', () => {
    host.label = 'Region';
    host.type = 'autocomplete';
    host.options = [
      { value: 'north', label: 'North' },
      { value: 'south', label: 'South' },
      { value: 'southeast', label: 'Southeast' },
    ];
    host.control = new FormControl<string | null>(null);
    fixture.detectChanges();

    const input = element.querySelector('input[matinput]') as HTMLInputElement;
    input.dispatchEvent(new Event('focusin'));
    input.value = 'sou';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const optionLabels = Array.from(document.querySelectorAll('mat-option')).map(
      (option) => option.textContent?.trim(),
    );
    expect(optionLabels).toEqual(['South', 'Southeast']);
  });

  it('renders chips for the control value and adds free-text chips on Enter', () => {
    host.label = 'Tags';
    host.type = 'chips';
    host.control = new FormControl<string[]>(['alpha'], { nonNullable: true });
    fixture.detectChanges();

    expect(element.querySelectorAll('mat-chip-row')).toHaveLength(1);

    const input = element.querySelector('input.mat-mdc-chip-input') as HTMLInputElement;
    input.value = 'beta';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(enterKeydown());
    fixture.detectChanges();

    expect(host.control?.value).toEqual(['alpha', 'beta']);
    expect(element.querySelectorAll('mat-chip-row')).toHaveLength(2);
  });

  it('removes a chip and writes the remaining values to the control', () => {
    host.label = 'Tags';
    host.type = 'chips';
    host.control = new FormControl<string[]>(['alpha', 'beta'], { nonNullable: true });
    fixture.detectChanges();

    const removeButtons = element.querySelectorAll<HTMLButtonElement>('[matchipremove]');
    expect(removeButtons).toHaveLength(2);
    removeButtons[0].click();
    fixture.detectChanges();

    expect(host.control?.value).toEqual(['beta']);
    expect(element.querySelectorAll('mat-chip-row')).toHaveLength(1);
  });

  it('renders a checkbox that toggles the control value', () => {
    host.label = 'Active only';
    host.type = 'checkbox';
    host.control = new FormControl<boolean>(false, { nonNullable: true });
    fixture.detectChanges();

    const input = element.querySelector('mat-checkbox input') as HTMLInputElement;
    expect(element.textContent).toContain('Active only');

    input.click();
    fixture.detectChanges();
    expect(host.control?.value).toBe(true);
  });

  it('shows a wrapper error for a touched invalid checkbox', () => {
    host.label = 'Accept terms';
    host.type = 'checkbox';
    host.control = new FormControl<boolean>(false, {
      nonNullable: true,
      validators: Validators.requiredTrue,
    });
    fixture.detectChanges();

    expect(element.querySelector('.m3k-form-field__error')).toBeNull();

    host.control.markAsTouched();
    fixture.detectChanges();

    expect(element.querySelector('.m3k-form-field__error')?.textContent).toContain(
      'Accept terms is required.',
    );
  });

  it('renders a slide toggle that writes through the control', () => {
    host.label = 'Include archived';
    host.type = 'toggle';
    host.hint = 'Adds closed records.';
    host.control = new FormControl<boolean>(false, { nonNullable: true });
    fixture.detectChanges();

    expect(element.querySelector('.m3k-form-field__hint')?.textContent).toContain(
      'Adds closed records.',
    );

    const toggle = element.querySelector('mat-slide-toggle button') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(host.control?.value).toBe(true);
  });

  it('renders radio buttons for the options and writes the picked value', () => {
    host.label = 'Priority';
    host.type = 'radio';
    host.options = [
      { value: 'low', label: 'Low' },
      { value: 'high', label: 'High' },
    ];
    host.control = new FormControl<unknown>(null);
    fixture.detectChanges();

    const radios = element.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios).toHaveLength(2);

    radios[1].click();
    fixture.detectChanges();
    expect(host.control?.value).toBe('high');
  });

  it('renders a slider with min, max, and step bound to the control', () => {
    host.label = 'Threshold';
    host.type = 'slider';
    host.min = 10;
    host.max = 50;
    host.step = 5;
    host.control = new FormControl<number>(25, { nonNullable: true });
    fixture.detectChanges();

    const thumb = element.querySelector('input[matsliderthumb]') as HTMLInputElement;
    expect(thumb.min).toBe('10');
    expect(thumb.max).toBe('50');
    expect(thumb.step).toBe('5');
    expect(thumb.valueAsNumber).toBe(25);
  });

  it('disables the rendered control when the form control is disabled', () => {
    host.label = 'Threshold';
    host.type = 'slider';
    host.control = new FormControl<number>({ value: 30, disabled: true }, { nonNullable: true });
    fixture.detectChanges();

    const thumb = element.querySelector('input[matsliderthumb]') as HTMLInputElement;
    expect(thumb.disabled).toBe(true);
  });

  it('renders a button-toggle group that writes the picked value', () => {
    host.label = 'View';
    host.type = 'button-toggle';
    host.options = [
      { value: 'table', label: 'Table' },
      { value: 'chart', label: 'Chart' },
    ];
    host.control = new FormControl<unknown>('table');
    fixture.detectChanges();

    const buttons = element.querySelectorAll<HTMLButtonElement>('mat-button-toggle button');
    expect(buttons).toHaveLength(2);

    buttons[1].click();
    fixture.detectChanges();
    expect(host.control?.value).toBe('chart');
  });

  it('binds a date-range field to the start and end controls of the range group', () => {
    host.label = 'Billing period';
    host.type = 'date-range';
    host.control = undefined;
    host.range = new FormGroup({
      start: new FormControl<Date | null>(new Date(2026, 0, 5)),
      end: new FormControl<Date | null>(null),
    });
    fixture.detectChanges();

    const start = element.querySelector('input[matstartdate]') as HTMLInputElement;
    const end = element.querySelector('input[matenddate]') as HTMLInputElement;
    expect(start.value).not.toBe('');

    end.value = '1/20/2026';
    end.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.range.controls.end.value?.getDate()).toBe(20);
  });

  it('shows a required error for a touched empty date-range', () => {
    host.label = 'Billing period';
    host.type = 'date-range';
    host.control = undefined;
    host.range = new FormGroup({
      start: new FormControl<Date | null>(null, Validators.required),
      end: new FormControl<Date | null>(null),
    });
    fixture.detectChanges();

    expect(element.querySelector('mat-error')).toBeNull();

    host.range.controls.start.markAsTouched();
    fixture.detectChanges();

    expect(element.querySelector('mat-error')?.textContent).toContain(
      'Billing period is required.',
    );
  });
});
