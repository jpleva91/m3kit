import { Component } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-slide-toggle` settings panel covering
 * checked, unchecked, disabled, and disabled+checked states.
 */
@Component({
  selector: 'parity-slide-toggles',
  standalone: true,
  imports: [MatSlideToggleModule],
  styles: [':host { display: grid; gap: 12px; max-width: 420px; }'],
  template: `
    <h4>Workspace settings</h4>
    <mat-slide-toggle [checked]="true">Auto-renew subscription</mat-slide-toggle>
    <mat-slide-toggle [checked]="true">Email alerts for overdue invoices</mat-slide-toggle>
    <mat-slide-toggle>Compact table density</mat-slide-toggle>
    <mat-slide-toggle>Share anonymized usage metrics</mat-slide-toggle>
    <mat-slide-toggle disabled>Beta reporting engine (waitlist)</mat-slide-toggle>
    <mat-slide-toggle disabled [checked]="true">
      Audit logging (enforced by org policy)
    </mat-slide-toggle>
  `,
})
class SlideTogglesComponent {}

const meta: Meta = {
  title: 'Material Parity/SlideToggle',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [SlideTogglesComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

export const WorkspaceSettings: Story = {
  render: () => ({ template: '<parity-slide-toggles />' }),
};
