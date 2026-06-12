import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

interface InvoiceDialogData {
  readonly invoiceId: string;
  readonly customer: string;
  readonly amount: number;
  readonly status: string;
}

/** Sample dialog: edit an invoice with a small pre-filled form. */
@Component({
  selector: 'parity-invoice-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit invoice {{ data.invoiceId }}</h2>
    <mat-dialog-content class="parity-dialog-form">
      <mat-form-field appearance="outline">
        <mat-label>Customer</mat-label>
        <input matInput [(ngModel)]="customer" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Amount (USD)</mat-label>
        <input matInput type="number" [(ngModel)]="amount" />
        <span matTextPrefix>$&nbsp;</span>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="status">
          <mat-option value="draft">Draft</mat-option>
          <mat-option value="sent">Sent</mat-option>
          <mat-option value="paid">Paid</mat-option>
          <mat-option value="overdue">Overdue</mat-option>
          <mat-option value="void">Void</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Internal note</mat-label>
        <textarea matInput rows="3">Customer asked for net-45 terms on this invoice.</textarea>
        <mat-hint>Visible to your team only</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [mat-dialog-close]="{ customer, amount, status }">
        Save changes
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .parity-dialog-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 360px;
        padding-top: 8px;
      }
    `,
  ],
})
class ParityInvoiceDialogComponent {
  customer: string;
  amount: number;
  status: string;

  constructor(
    readonly dialogRef: MatDialogRef<ParityInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: InvoiceDialogData
  ) {
    this.customer = data.customer;
    this.amount = data.amount;
    this.status = data.status;
  }
}

/**
 * Plain Angular Material `MatDialog` launcher (no m3kit wrapper). Opens a
 * realistic pre-filled "edit invoice" form dialog; also offers a destructive
 * confirmation variant via the same dialog service.
 */
@Component({
  selector: 'parity-dialog-launcher',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="parity-launchers">
      <button mat-flat-button (click)="openEdit()">
        <mat-icon>edit</mat-icon>
        Edit invoice INV-0042
      </button>
      <button mat-stroked-button (click)="openWide()">
        <mat-icon>open_in_full</mat-icon>
        Edit invoice (wide, blocking)
      </button>
      <p class="parity-result">Last dialog result: {{ lastResult }}</p>
    </div>
  `,
  styles: [
    `
      .parity-launchers {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .parity-result {
        margin: 0;
        font: var(--mat-sys-body-small);
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
class ParityDialogLauncherComponent {
  lastResult = '(none yet)';

  constructor(private readonly dialog: MatDialog) {}

  private readonly data: InvoiceDialogData = {
    invoiceId: 'INV-0042',
    customer: 'Cascade Outfitters',
    amount: 1287.5,
    status: 'sent',
  };

  openEdit(): void {
    this.dialog
      .open(ParityInvoiceDialogComponent, { data: this.data })
      .afterClosed()
      .subscribe((result) => {
        this.lastResult = result ? JSON.stringify(result) : 'cancelled';
      });
  }

  openWide(): void {
    this.dialog
      .open(ParityInvoiceDialogComponent, {
        data: this.data,
        width: '560px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result) => {
        this.lastResult = result ? JSON.stringify(result) : 'cancelled';
      });
  }
}

const meta: Meta<ParityDialogLauncherComponent> = {
  component: ParityDialogLauncherComponent,
  title: 'Material Parity/Dialog',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityDialogLauncherComponent>;

export const EditInvoiceDialog: Story = {};
