import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, signal } from '@angular/core';
import type { MatChipInputEvent } from '@angular/material/chips';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-chip-grid` (input chips with add/remove)
 * and `mat-chip-listbox` (selectable filter chips).
 */
@Component({
  selector: 'parity-chips-input',
  standalone: true,
  imports: [MatChipsModule, MatFormFieldModule, MatIconModule],
  styles: [':host { display: grid; gap: 16px; max-width: 480px; }'],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Order tags</mat-label>
      <mat-chip-grid #tagGrid aria-label="Order tag entry">
        @for (tag of tags(); track tag) {
          <mat-chip-row (removed)="removeTag(tag)">
            {{ tag }}
            <button matChipRemove [attr.aria-label]="'Remove ' + tag">
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        }
        <input
          placeholder="Add tag…"
          [matChipInputFor]="tagGrid"
          [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
          (matChipInputTokenEnd)="addTag($event)"
        />
      </mat-chip-grid>
      <mat-hint>Press Enter or comma to add a tag.</mat-hint>
    </mat-form-field>
  `,
})
class ChipsInputComponent {
  readonly separatorKeyCodes = [ENTER, COMMA] as const;
  readonly tags = signal<readonly string[]>([
    'wholesale',
    'net-30',
    'priority',
    'fragile',
  ]);

  addTag(event: MatChipInputEvent): void {
    const value = event.value.trim();
    if (value && !this.tags().includes(value)) {
      this.tags.update((tags) => [...tags, value]);
    }
    event.chipInput.clear();
  }

  removeTag(tag: string): void {
    this.tags.update((tags) => tags.filter((candidate) => candidate !== tag));
  }
}

@Component({
  selector: 'parity-chips-listbox',
  standalone: true,
  imports: [MatChipsModule],
  styles: [':host { display: grid; gap: 8px; max-width: 560px; }'],
  template: `
    <h4>Invoice status filter</h4>
    <mat-chip-listbox multiple aria-label="Invoice status filter">
      <mat-chip-option selected>Draft</mat-chip-option>
      <mat-chip-option selected>Sent</mat-chip-option>
      <mat-chip-option>Paid</mat-chip-option>
      <mat-chip-option selected>Overdue</mat-chip-option>
      <mat-chip-option disabled>Void</mat-chip-option>
    </mat-chip-listbox>

    <h4>Product category</h4>
    <mat-chip-listbox aria-label="Product category">
      <mat-chip-option>Hardware</mat-chip-option>
      <mat-chip-option selected>Software</mat-chip-option>
      <mat-chip-option>Services</mat-chip-option>
    </mat-chip-listbox>
  `,
})
class ChipsListboxComponent {}

const meta: Meta = {
  title: 'Material Parity/Chips',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [ChipsInputComponent, ChipsListboxComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

export const InputChips: Story = {
  render: () => ({ template: '<parity-chips-input />' }),
};

export const FilterListbox: Story = {
  render: () => ({ template: '<parity-chips-listbox />' }),
};
