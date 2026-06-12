import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

/**
 * Parity gallery: raw Angular Material stepper (horizontal and vertical) with
 * linear step controls backed by pre-filled reactive forms.
 */
@Component({
  selector: 'parity-stepper-demo',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-stepper [orientation]="orientation()" linear>
      <mat-step [stepControl]="customerForm" label="Customer" state="edit">
        <form [formGroup]="customerForm" class="parity-step-form">
          <mat-form-field appearance="outline">
            <mat-label>Company</mat-label>
            <input matInput formControlName="company" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Billing email</mat-label>
            <input matInput formControlName="email" type="email" />
            <mat-hint>Invoices and reminders go here</mat-hint>
          </mat-form-field>
          <div class="parity-step-actions">
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>

      <mat-step [stepControl]="orderForm" label="Order details">
        <form [formGroup]="orderForm" class="parity-step-form">
          <mat-form-field appearance="outline">
            <mat-label>Product</mat-label>
            <mat-select formControlName="product">
              <mat-option value="analytics">Analytics add-on</mat-option>
              <mat-option value="support">Support retainer</mat-option>
              <mat-option value="onboarding">Onboarding package</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Quantity</mat-label>
            <input matInput formControlName="quantity" type="number" />
          </mat-form-field>
          <div class="parity-step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>

      <mat-step label="Review" optional>
        <p class="parity-review">
          Northwind Traders · billing&#64;northwind.example · Support retainer ×
          3 seats. Submitting creates a draft invoice in the approved synthetic
          dataset.
        </p>
        <div class="parity-step-actions">
          <button mat-button matStepperPrevious>Back</button>
          <button mat-flat-button>Create draft invoice</button>
        </div>
      </mat-step>
    </mat-stepper>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 760px;
        padding: 16px;
      }
      .parity-step-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 16px;
        max-width: 360px;
      }
      .parity-step-actions {
        display: flex;
        gap: 8px;
        padding-top: 8px;
      }
      .parity-review {
        padding-top: 16px;
        margin: 0;
      }
    `,
  ],
})
class ParityStepperDemoComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly customerForm = this.fb.group({
    company: ['Northwind Traders', Validators.required],
    email: ['billing@northwind.example', [Validators.required, Validators.email]],
  });

  protected readonly orderForm = this.fb.group({
    product: ['support', Validators.required],
    quantity: [3, [Validators.required, Validators.min(1)]],
  });
}

const meta: Meta<ParityStepperDemoComponent> = {
  component: ParityStepperDemoComponent,
  title: 'Atoms/Stepper',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityStepperDemoComponent>;

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
};
