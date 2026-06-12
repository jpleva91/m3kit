import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/**
 * Parity gallery: raw Angular Material accordion — expanded, collapsed and
 * disabled panels, header descriptions, an embedded form and an action row.
 */
@Component({
  selector: 'parity-expansion-demo',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-accordion>
      <mat-expansion-panel expanded>
        <mat-expansion-panel-header>
          <mat-panel-title>Billing profile</mat-panel-title>
          <mat-panel-description>
            Acme Corp · Net 30
            <mat-icon>account_balance</mat-icon>
          </mat-panel-description>
        </mat-expansion-panel-header>

        <mat-form-field appearance="outline" class="parity-field">
          <mat-label>Billing contact</mat-label>
          <input matInput [ngModel]="'Dana Whitfield'" name="contact" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="parity-field">
          <mat-label>Purchase order reference</mat-label>
          <input matInput [ngModel]="'PO-2026-0314'" name="po" />
          <mat-hint>Printed on every invoice</mat-hint>
        </mat-form-field>

        <mat-action-row>
          <button mat-button>Discard</button>
          <button mat-flat-button>Save profile</button>
        </mat-action-row>
      </mat-expansion-panel>

      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>Order history</mat-panel-title>
          <mat-panel-description>
            96 orders · last on Mar 20, 2026
            <mat-icon>shopping_cart</mat-icon>
          </mat-panel-description>
        </mat-expansion-panel-header>
        <p>
          Recent orders include the support retainer renewal and three
          analytics add-on seats. Full history lives in the orders table.
        </p>
      </mat-expansion-panel>

      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>Support tickets</mat-panel-title>
          <mat-panel-description>
            2 open · 41 resolved
            <mat-icon>support_agent</mat-icon>
          </mat-panel-description>
        </mat-expansion-panel-header>
        <p>
          Ticket #5817 (export job stuck) is awaiting an engineering follow-up;
          ticket #5809 (tax rounding) was resolved yesterday.
        </p>
      </mat-expansion-panel>

      <mat-expansion-panel disabled>
        <mat-expansion-panel-header>
          <mat-panel-title>Legacy contracts</mat-panel-title>
          <mat-panel-description>Archived — read only</mat-panel-description>
        </mat-expansion-panel-header>
      </mat-expansion-panel>
    </mat-accordion>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 680px;
        padding: 16px;
      }
      .parity-field {
        display: block;
        max-width: 360px;
        margin-bottom: 8px;
      }
      mat-panel-description {
        justify-content: space-between;
        align-items: center;
      }
    `,
  ],
})
class ParityExpansionDemoComponent {}

const meta: Meta<ParityExpansionDemoComponent> = {
  component: ParityExpansionDemoComponent,
  title: 'Material Parity/Expansion Panel',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityExpansionDemoComponent>;

export const Accordion: Story = {};
