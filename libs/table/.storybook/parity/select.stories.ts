import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-select` with option groups and
 * multi-select, rendered against brand tokens only.
 */
@Component({
  selector: 'parity-select-groups',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Product</mat-label>
      <mat-select [formControl]="product">
        @for (group of productGroups; track group.label) {
          <mat-optgroup [label]="group.label" [disabled]="group.disabled">
            @for (option of group.options; track option) {
              <mat-option [value]="option">{{ option }}</mat-option>
            }
          </mat-optgroup>
        }
      </mat-select>
      <mat-hint>Grouped by catalog category.</mat-hint>
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Ticket status</mat-label>
      <mat-select [formControl]="status">
        @for (option of statuses; track option.value) {
          <mat-option [value]="option.value" [disabled]="option.disabled">
            {{ option.label }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
class SelectGroupsComponent {
  readonly productGroups = [
    {
      label: 'Hardware',
      disabled: false,
      options: ['Sensor array', 'Edge gateway', 'Rack mount kit'],
    },
    {
      label: 'Software',
      disabled: false,
      options: ['Fleet console', 'Analytics add-on', 'API seats'],
    },
    {
      label: 'Discontinued',
      disabled: true,
      options: ['Legacy hub', 'Serial bridge'],
    },
  ];
  readonly statuses = [
    { value: 'open', label: 'Open', disabled: false },
    { value: 'in-progress', label: 'In progress', disabled: false },
    { value: 'resolved', label: 'Resolved', disabled: false },
    { value: 'archived', label: 'Archived', disabled: true },
  ];
  readonly product = new FormControl('Edge gateway');
  readonly status = new FormControl('in-progress');
}

@Component({
  selector: 'parity-select-multi',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  styles: [':host { display: grid; gap: 16px; max-width: 420px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Invoice statuses</mat-label>
      <mat-select [formControl]="invoiceStatuses" multiple>
        @for (option of allStatuses; track option) {
          <mat-option [value]="option">{{ option }}</mat-option>
        }
      </mat-select>
      <mat-hint>Filter applies to the invoices report.</mat-hint>
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Assigned regions</mat-label>
      <mat-select [formControl]="regions" multiple>
        @for (region of allRegions; track region) {
          <mat-option [value]="region">{{ region }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
class SelectMultiComponent {
  readonly allStatuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Void'];
  readonly allRegions = ['North America', 'EMEA', 'APAC', 'LATAM'];
  readonly invoiceStatuses = new FormControl(['Sent', 'Overdue']);
  readonly regions = new FormControl({ value: ['EMEA', 'APAC'], disabled: true });
}

const meta: Meta = {
  title: 'Material Parity/Select',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [SelectGroupsComponent, SelectMultiComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

export const OptionGroups: Story = {
  render: () => ({ template: '<parity-select-groups />' }),
};

export const MultiSelect: Story = {
  render: () => ({ template: '<parity-select-multi />' }),
};
