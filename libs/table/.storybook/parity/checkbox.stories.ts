import { Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-checkbox` in every meaningful state —
 * checked, unchecked, indeterminate, disabled, and disabled+checked.
 */
@Component({
  selector: 'parity-checkbox-states',
  standalone: true,
  imports: [MatCheckboxModule],
  styles: [':host { display: grid; gap: 8px; max-width: 420px; }'],
  template: `
    <mat-checkbox [checked]="true">Email me when an invoice is paid</mat-checkbox>
    <mat-checkbox [checked]="true">Weekly order summary digest</mat-checkbox>
    <mat-checkbox>Notify on overdue invoices</mat-checkbox>
    <mat-checkbox [indeterminate]="true">
      All ticket categories (3 of 5 selected)
    </mat-checkbox>
    <mat-checkbox disabled>SMS alerts (requires verified phone)</mat-checkbox>
    <mat-checkbox disabled [checked]="true">
      Mandatory security notices
    </mat-checkbox>
  `,
})
class CheckboxStatesComponent {}

const meta: Meta = {
  title: 'Atoms/Checkbox',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [CheckboxStatesComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

export const NotificationPreferences: Story = {
  render: () => ({ template: '<parity-checkbox-states />' }),
};
