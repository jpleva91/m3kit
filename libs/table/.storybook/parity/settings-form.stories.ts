import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { FormControl, Validators } from '@angular/forms';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

import {
  FormFieldComponent,
  FormSectionComponent,
  type FormFieldOption,
} from '@m3kit/forms';
import {
  BreadcrumbsComponent,
  ContentLayoutComponent,
  PageHeaderComponent,
  type BreadcrumbItem,
} from '@m3kit/shell';

/**
 * Pages: a settings page — `ContentLayout` (centered) wrapping
 * `Breadcrumbs`, a `PageHeader` with actions, and typed `FormSection` /
 * `FormField` groups. Every control is a plain `FormControl`, so the story
 * is copyable source for a real routed settings page.
 */

const BREADCRUMBS: readonly BreadcrumbItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Workspace', path: '/workspace' },
  { label: 'Settings' },
];

const PLAN_OPTIONS: readonly FormFieldOption[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'team', label: 'Team' },
  { value: 'enterprise', label: 'Enterprise' },
];

const CURRENCY_OPTIONS: readonly FormFieldOption[] = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'Pound Sterling (GBP)' },
];

const DIGEST_OPTIONS: readonly FormFieldOption[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'never', label: 'Never' },
];

const meta: Meta<ContentLayoutComponent> = {
  component: ContentLayoutComponent,
  title: 'Pages/SettingsForm',
  parameters: {
    docs: { source: { type: 'code' } },
  },
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([], withDisabledInitialNavigation()),
        provideAnimations(),
        provideNativeDateAdapter(),
      ],
    }),
    moduleMetadata({
      imports: [
        BreadcrumbsComponent,
        PageHeaderComponent,
        FormSectionComponent,
        FormFieldComponent,
        MatButtonModule,
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ContentLayoutComponent>;

export const WorkspaceSettings: Story = {
  render: () => ({
    props: {
      breadcrumbs: BREADCRUMBS,
      planOptions: PLAN_OPTIONS,
      currencyOptions: CURRENCY_OPTIONS,
      digestOptions: DIGEST_OPTIONS,
      nameControl: new FormControl<string | null>('Meridian Analytics', {
        validators: [Validators.required],
      }),
      billingEmailControl: new FormControl<string | null>(
        'billing@meridian.example',
        { validators: [Validators.required, Validators.email] }
      ),
      descriptionControl: new FormControl<string | null>(
        'Shared reporting workspace for the finance team.'
      ),
      planControl: new FormControl<string | null>('team'),
      currencyControl: new FormControl<string | null>('USD'),
      creditLimitControl: new FormControl<number | null>(25000),
      renewalControl: new FormControl<Date | null>(new Date(2026, 11, 1)),
      invoiceRemindersControl: new FormControl<boolean | null>(true),
      digestControl: new FormControl<string | null>('weekly'),
      seatsControl: new FormControl<number | null>(12),
    },
    template: `
      <m3k-content-layout mode="centered">
        <div style="display: grid; gap: 1.25rem;">
          <m3k-breadcrumbs [items]="breadcrumbs" />

          <m3k-page-header title="Workspace settings" subtitle="Profile, billing, and notification preferences">
            <div m3kPageHeaderActions style="display: flex; gap: 8px;">
              <button mat-stroked-button type="button">Discard</button>
              <button mat-flat-button type="button">Save changes</button>
            </div>
          </m3k-page-header>

          <m3k-form-section
            title="Workspace profile"
            description="How this workspace appears to teammates and on exported reports."
          >
            <m3k-form-field label="Workspace name" type="text" [control]="nameControl" [required]="true" />
            <m3k-form-field label="Plan" type="select" [control]="planControl" [options]="planOptions" />
            <m3k-form-field
              label="Description"
              type="textarea"
              [control]="descriptionControl"
              [rows]="3"
              hint="Shown on the workspace switcher."
            />
            <m3k-form-field label="Seats" type="slider" [control]="seatsControl" [min]="1" [max]="50" [step]="1" />
          </m3k-form-section>

          <m3k-form-section
            title="Billing"
            description="Invoicing details used on every statement."
          >
            <m3k-form-field label="Billing email" type="text" [control]="billingEmailControl" [required]="true" />
            <m3k-form-field label="Currency" type="select" [control]="currencyControl" [options]="currencyOptions" />
            <m3k-form-field label="Credit limit" type="currency" [control]="creditLimitControl" />
            <m3k-form-field label="Renewal date" type="date" [control]="renewalControl" />
          </m3k-form-section>

          <m3k-form-section title="Notifications">
            <m3k-form-field label="Overdue invoice reminders" type="toggle" [control]="invoiceRemindersControl" />
            <m3k-form-field
              label="Activity digest"
              type="button-toggle"
              [control]="digestControl"
              [options]="digestOptions"
            />
          </m3k-form-section>
        </div>
      </m3k-content-layout>
    `,
  }),
};
