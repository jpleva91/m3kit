import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-datepicker` and `mat-date-range-picker`
 * on plain form fields, using the native date adapter.
 */
@Component({
  selector: 'parity-datepicker',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
  ],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Invoice due date</mat-label>
      <input matInput [matDatepicker]="duePicker" [formControl]="dueDate" />
      <mat-hint>Net-30 from issue date.</mat-hint>
      <mat-datepicker-toggle matIconSuffix [for]="duePicker" />
      <mat-datepicker #duePicker />
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Order placed on</mat-label>
      <input matInput [matDatepicker]="placedPicker" [formControl]="placedOn" />
      <mat-datepicker-toggle matIconSuffix [for]="placedPicker" />
      <mat-datepicker #placedPicker />
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Contract start (locked)</mat-label>
      <input matInput [matDatepicker]="contractPicker" [formControl]="contractStart" />
      <mat-datepicker-toggle matIconSuffix [for]="contractPicker" />
      <mat-datepicker #contractPicker />
    </mat-form-field>
  `,
})
class DatepickerComponent {
  readonly dueDate = new FormControl(new Date(2026, 6, 15));
  readonly placedOn = new FormControl(new Date(2026, 5, 2));
  readonly contractStart = new FormControl({
    value: new Date(2025, 0, 1),
    disabled: true,
  });
}

@Component({
  selector: 'parity-date-range',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
  ],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Billing period</mat-label>
      <mat-date-range-input [formGroup]="billingPeriod" [rangePicker]="billingPicker">
        <input matStartDate formControlName="start" placeholder="Start date" />
        <input matEndDate formControlName="end" placeholder="End date" />
      </mat-date-range-input>
      <mat-hint>Used by the invoices report filter.</mat-hint>
      <mat-datepicker-toggle matIconSuffix [for]="billingPicker" />
      <mat-date-range-picker #billingPicker />
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Ticket activity window</mat-label>
      <mat-date-range-input [formGroup]="activityWindow" [rangePicker]="activityPicker">
        <input matStartDate formControlName="start" placeholder="From" />
        <input matEndDate formControlName="end" placeholder="To" />
      </mat-date-range-input>
      <mat-datepicker-toggle matIconSuffix [for]="activityPicker" />
      <mat-date-range-picker #activityPicker />
    </mat-form-field>
  `,
})
class DateRangeComponent {
  readonly billingPeriod = new FormGroup({
    start: new FormControl<Date | null>(new Date(2026, 4, 1)),
    end: new FormControl<Date | null>(new Date(2026, 4, 31)),
  });
  readonly activityWindow = new FormGroup({
    start: new FormControl<Date | null>(new Date(2026, 5, 1)),
    end: new FormControl<Date | null>(new Date(2026, 5, 11)),
  });
}

const meta: Meta = {
  title: 'Material Parity/Datepicker',
  decorators: [
    applicationConfig({
      providers: [provideAnimations(), provideNativeDateAdapter()],
    }),
    moduleMetadata({ imports: [DatepickerComponent, DateRangeComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

export const SingleDate: Story = {
  render: () => ({ template: '<parity-datepicker />' }),
};

export const DateRange: Story = {
  render: () => ({ template: '<parity-date-range />' }),
};
