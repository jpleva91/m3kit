import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatTimepickerModule,
  type MatTimepickerOption,
} from '@angular/material/timepicker';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-timepicker` on plain form fields,
 * using the native date adapter.
 */
@Component({
  selector: 'parity-timepicker',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    ReactiveFormsModule,
  ],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Support callback time</mat-label>
      <input matInput [matTimepicker]="callbackPicker" [formControl]="callbackAt" />
      <mat-hint>Agents call within the selected hour.</mat-hint>
      <mat-timepicker-toggle matIconSuffix [for]="callbackPicker" />
      <mat-timepicker #callbackPicker />
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Order cutoff</mat-label>
      <input matInput [matTimepicker]="cutoffPicker" [formControl]="cutoffAt" />
      <mat-timepicker-toggle matIconSuffix [for]="cutoffPicker" />
      <mat-timepicker #cutoffPicker />
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Invoice batch run (locked)</mat-label>
      <input matInput [matTimepicker]="batchPicker" [formControl]="batchAt" />
      <mat-timepicker-toggle matIconSuffix [for]="batchPicker" />
      <mat-timepicker #batchPicker />
    </mat-form-field>
  `,
})
class TimepickerComponent {
  readonly callbackAt = new FormControl(new Date(2026, 5, 12, 9, 30));
  readonly cutoffAt = new FormControl(new Date(2026, 5, 12, 16, 0));
  readonly batchAt = new FormControl({
    value: new Date(2026, 5, 12, 2, 0),
    disabled: true,
  });
}

@Component({
  selector: 'parity-timepicker-options',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    ReactiveFormsModule,
  ],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Delivery window start</mat-label>
      <input
        matInput
        [matTimepicker]="deliveryPicker"
        [matTimepickerMin]="windowMin"
        [matTimepickerMax]="windowMax"
        [formControl]="deliveryAt"
      />
      <mat-hint>Business hours only, 30-minute slots.</mat-hint>
      <mat-timepicker-toggle matIconSuffix [for]="deliveryPicker" />
      <mat-timepicker #deliveryPicker interval="30m" />
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Ticket escalation check-in</mat-label>
      <input matInput [matTimepicker]="shiftPicker" [formControl]="checkInAt" />
      <mat-timepicker-toggle matIconSuffix [for]="shiftPicker" />
      <mat-timepicker #shiftPicker [options]="shiftOptions" />
    </mat-form-field>
  `,
})
class TimepickerOptionsComponent {
  readonly windowMin = new Date(2026, 5, 12, 8, 0);
  readonly windowMax = new Date(2026, 5, 12, 18, 0);
  readonly deliveryAt = new FormControl(new Date(2026, 5, 12, 10, 30));
  readonly checkInAt = new FormControl<Date | null>(null);
  readonly shiftOptions: MatTimepickerOption<Date>[] = [
    { value: new Date(2026, 5, 12, 9, 0), label: 'Morning stand-up (9:00 AM)' },
    { value: new Date(2026, 5, 12, 13, 0), label: 'Midday review (1:00 PM)' },
    { value: new Date(2026, 5, 12, 17, 0), label: 'End of shift (5:00 PM)' },
  ];
}

const meta: Meta = {
  title: 'Atoms/Timepicker',
  decorators: [
    applicationConfig({
      providers: [provideAnimations(), provideNativeDateAdapter()],
    }),
    moduleMetadata({
      imports: [TimepickerComponent, TimepickerOptionsComponent],
    }),
  ],
};
export default meta;
type Story = StoryObj;

export const SingleTime: Story = {
  render: () => ({ template: '<parity-timepicker />' }),
};

export const IntervalAndOptions: Story = {
  render: () => ({ template: '<parity-timepicker-options />' }),
};
