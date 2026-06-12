import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

/**
 * Material parity gallery: raw `mat-slider` — continuous, discrete with tick
 * marks, disabled, and a two-thumb range slider.
 */
@Component({
  selector: 'parity-sliders',
  standalone: true,
  imports: [MatSliderModule, FormsModule],
  styles: [
    ':host { display: grid; gap: 8px; max-width: 480px; } mat-slider { width: 100%; }',
  ],
  template: `
    <label for="reorder-threshold">Reorder threshold ({{ reorderThreshold }} units)</label>
    <mat-slider min="0" max="100">
      <input id="reorder-threshold" matSliderThumb [(ngModel)]="reorderThreshold" />
    </mat-slider>

    <label for="discount">Volume discount ({{ discount }}%)</label>
    <mat-slider min="0" max="30" step="5" discrete showTickMarks>
      <input id="discount" matSliderThumb [(ngModel)]="discount" />
    </mat-slider>

    <label for="retention">Log retention (fixed by plan)</label>
    <mat-slider min="30" max="365" disabled>
      <input id="retention" matSliderThumb [(ngModel)]="retentionDays" />
    </mat-slider>
  `,
})
class SlidersComponent {
  reorderThreshold = 35;
  discount = 15;
  retentionDays = 90;
}

@Component({
  selector: 'parity-range-slider',
  standalone: true,
  imports: [MatSliderModule, FormsModule],
  styles: [
    ':host { display: grid; gap: 8px; max-width: 480px; } mat-slider { width: 100%; }',
  ],
  template: `
    <label for="order-total-min">
      Order total filter ({{ minTotal }} – {{ maxTotal }} USD)
    </label>
    <mat-slider min="0" max="1000" step="10" discrete>
      <input id="order-total-min" matSliderStartThumb [(ngModel)]="minTotal" />
      <input id="order-total-max" matSliderEndThumb [(ngModel)]="maxTotal" />
    </mat-slider>

    <label for="response-min">
      Ticket response window ({{ minHours }} – {{ maxHours }} hours)
    </label>
    <mat-slider min="0" max="72" step="4" discrete showTickMarks>
      <input id="response-min" matSliderStartThumb [(ngModel)]="minHours" />
      <input id="response-max" matSliderEndThumb [(ngModel)]="maxHours" />
    </mat-slider>
  `,
})
class RangeSliderComponent {
  minTotal = 120;
  maxTotal = 640;
  minHours = 8;
  maxHours = 48;
}

const meta: Meta = {
  title: 'Material Parity/Slider',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
    moduleMetadata({ imports: [SlidersComponent, RangeSliderComponent] }),
  ],
};
export default meta;
type Story = StoryObj;

export const SingleThumb: Story = {
  render: () => ({ template: '<parity-sliders />' }),
};

export const Range: Story = {
  render: () => ({ template: '<parity-range-slider />' }),
};
