import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-form-field` + `matInput` (no m3kit
 * wrappers), proving the brand token system covers plain Angular Material.
 */
@Component({
  selector: 'parity-form-field-variants',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="fill">
      <mat-label>Customer name</mat-label>
      <input matInput [formControl]="customerName" />
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Billing email</mat-label>
      <input matInput type="email" [formControl]="billingEmail" />
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Internal note</mat-label>
      <textarea matInput rows="3" [formControl]="note"></textarea>
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Account manager</mat-label>
      <input matInput [formControl]="accountManager" />
    </mat-form-field>
  `,
})
class FormFieldVariantsComponent {
  readonly customerName = new FormControl('Halvorsen Logistics A/S');
  readonly billingEmail = new FormControl('accounts@halvorsen.example');
  readonly note = new FormControl(
    'Net-30 customer since 2024. Prefers consolidated monthly invoices.'
  );
  readonly accountManager = new FormControl({ value: 'Priya Raman', disabled: true });
}

@Component({
  selector: 'parity-form-field-prefix-suffix',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, ReactiveFormsModule],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Credit limit</mat-label>
      <span matTextPrefix>$&nbsp;</span>
      <input matInput type="number" [formControl]="creditLimit" />
      <span matTextSuffix>.00</span>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Search orders</mat-label>
      <mat-icon matIconPrefix>search</mat-icon>
      <input matInput [formControl]="orderSearch" />
      <mat-icon matIconSuffix>close</mat-icon>
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Support phone</mat-label>
      <mat-icon matIconPrefix>phone</mat-icon>
      <input matInput type="tel" [formControl]="phone" />
    </mat-form-field>
  `,
})
class FormFieldPrefixSuffixComponent {
  readonly creditLimit = new FormControl(25000);
  readonly orderSearch = new FormControl('ORD-2026-0142');
  readonly phone = new FormControl('+1 555 0142');
}

@Component({
  selector: 'parity-form-field-hints-errors',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Invoice reference</mat-label>
      <input matInput [formControl]="reference" maxlength="12" />
      <mat-hint>Format: INV-YYYY-NNN</mat-hint>
      <mat-hint align="end">{{ reference.value?.length ?? 0 }}/12</mat-hint>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Contact email</mat-label>
      <input matInput type="email" [formControl]="email" />
      @if (email.hasError('required')) {
        <mat-error>Contact email is required.</mat-error>
      }
      @if (email.hasError('email')) {
        <mat-error>Enter a valid email address.</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Reorder quantity</mat-label>
      <input matInput type="number" [formControl]="quantity" />
      <mat-hint>Minimum order is 10 units.</mat-hint>
      @if (quantity.hasError('min')) {
        <mat-error>Quantity must be at least 10.</mat-error>
      }
    </mat-form-field>
  `,
})
class FormFieldHintsErrorsComponent {
  readonly reference = new FormControl('INV-2026-031');
  readonly email = new FormControl<string | null>(null, [
    Validators.required,
    Validators.email,
  ]);
  readonly quantity = new FormControl(3, [Validators.min(10)]);

  constructor() {
    this.email.markAsTouched();
    this.quantity.markAsTouched();
  }
}

const meta: Meta = {
  title: 'Material Parity/FormField + Input',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({
      imports: [
        FormFieldVariantsComponent,
        FormFieldPrefixSuffixComponent,
        FormFieldHintsErrorsComponent,
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => ({ template: '<parity-form-field-variants />' }),
};

export const PrefixAndSuffix: Story = {
  render: () => ({ template: '<parity-form-field-prefix-suffix />' }),
};

export const HintsAndErrors: Story = {
  render: () => ({ template: '<parity-form-field-hints-errors />' }),
};
