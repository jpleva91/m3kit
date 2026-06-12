import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  StepperFlowComponent,
  StepperFlowFooterExtrasDirective,
  StepperFlowPanelDirective,
} from './stepper-flow.component';
import { StepDefinition } from './stepper-flow-model';

const ORDER_STEPS: readonly StepDefinition[] = [
  { id: 'customer', label: 'Customer' },
  { id: 'items', label: 'Line items' },
  { id: 'review', label: 'Review & submit' },
];

@Component({
  imports: [
    StepperFlowComponent,
    StepperFlowPanelDirective,
    StepperFlowFooterExtrasDirective,
  ],
  template: `
    <m3k-stepper-flow
      [steps]="steps"
      [orientation]="orientation"
      [linear]="linear"
      [(activeStepIndex)]="activeStepIndex"
      (completed)="completions = completions + 1"
    >
      <ng-template m3kStepPanel="customer" let-step>
        <p class="probe-customer">Customer: {{ step.label }}</p>
      </ng-template>
      <ng-template m3kStepPanel="items">
        <p class="probe-items">Line items</p>
      </ng-template>
      <ng-template m3kStepPanel="review">
        <p class="probe-review">Review order</p>
      </ng-template>
      @if (withExtras) {
        <ng-template m3kStepperFooterExtras>
          <span class="probe-extras">Draft saved</span>
        </ng-template>
      }
    </m3k-stepper-flow>
  `,
})
class HostComponent {
  steps: readonly StepDefinition[] = ORDER_STEPS;
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  linear = true;
  activeStepIndex = 0;
  completions = 0;
  withExtras = false;

  complete(...ids: readonly string[]) {
    this.steps = this.steps.map((step) =>
      ids.includes(step.id) ? { ...step, completed: true } : step,
    );
  }
}

describe('StepperFlowComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const headers = () =>
    Array.from(element().querySelectorAll('.mat-step-header'));

  const selectedIndex = () =>
    headers().findIndex(
      (header) => header.getAttribute('aria-selected') === 'true',
    );

  const nextButtons = () =>
    Array.from(
      element().querySelectorAll<HTMLButtonElement>('.m3k-stepper-flow__next'),
    );

  const backButtons = () =>
    Array.from(
      element().querySelectorAll<HTMLButtonElement>('.m3k-stepper-flow__back'),
    );

  const finishButton = () =>
    element().querySelector<HTMLButtonElement>('.m3k-stepper-flow__finish');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('rendering', () => {
    it('renders one step header per definition, in order', () => {
      const labels = Array.from(
        element().querySelectorAll('.mat-step-text-label'),
      ).map((label) => label.textContent?.trim());
      expect(labels).toEqual(['Customer', 'Line items', 'Review & submit']);
    });

    it('stamps each panel template by step id with the step as context', () => {
      expect(
        element().querySelector('.probe-customer')?.textContent?.trim(),
      ).toBe('Customer: Customer');
      expect(element().querySelector('.probe-items')).toBeTruthy();
      expect(element().querySelector('.probe-review')).toBeTruthy();
    });

    it('renders a Back/Next footer per step and Finish only on the last', () => {
      expect(backButtons()).toHaveLength(3);
      expect(nextButtons()).toHaveLength(2);
      expect(finishButton()).toBeTruthy();
    });

    it('renders an empty footer-extras region when no slot is projected', () => {
      const extras = element().querySelectorAll(
        '.m3k-stepper-flow__footer-extras',
      );
      expect(extras).toHaveLength(3);
      expect(extras[0].children).toHaveLength(0);
    });

    it('stamps the footer-extras template into every step footer', () => {
      host.withExtras = true;
      fixture.detectChanges();

      expect(
        element().querySelectorAll(
          '.m3k-stepper-flow__footer-extras .probe-extras',
        ),
      ).toHaveLength(3);
    });

    it('supports the vertical orientation', () => {
      host.orientation = 'vertical';
      fixture.detectChanges();

      expect(element().querySelector('mat-stepper')?.classList).toContain(
        'mat-stepper-vertical',
      );
    });
  });

  describe('linear gating', () => {
    it('disables Next while the active step is incomplete', () => {
      expect(nextButtons()[0].disabled).toBe(true);
    });

    it('enables Next once the step is marked completed, and advances', () => {
      host.complete('customer');
      fixture.detectChanges();

      expect(nextButtons()[0].disabled).toBe(false);
      nextButtons()[0].click();
      fixture.detectChanges();

      expect(selectedIndex()).toBe(1);
      expect(host.activeStepIndex).toBe(1);
    });

    it('leaves Next enabled on an incomplete optional step', () => {
      host.steps = [
        { id: 'customer', label: 'Customer', completed: true },
        { id: 'items', label: 'Line items', optional: true },
        { id: 'review', label: 'Review & submit' },
      ];
      host.activeStepIndex = 1;
      fixture.detectChanges();

      expect(nextButtons()[1].disabled).toBe(false);
    });

    it('does not gate advancement when linear is false', () => {
      host.linear = false;
      fixture.detectChanges();

      expect(nextButtons()[0].disabled).toBe(false);
      nextButtons()[0].click();
      fixture.detectChanges();

      expect(selectedIndex()).toBe(1);
    });
  });

  describe('two-way activeStepIndex', () => {
    it('moves the stepper when the bound index changes', () => {
      host.linear = false;
      host.activeStepIndex = 2;
      fixture.detectChanges();

      expect(selectedIndex()).toBe(2);
    });

    it('writes back to the binding when navigating via the footer', () => {
      host.linear = false;
      fixture.detectChanges();

      nextButtons()[0].click();
      fixture.detectChanges();
      expect(host.activeStepIndex).toBe(1);

      backButtons()[1].click();
      fixture.detectChanges();
      expect(host.activeStepIndex).toBe(0);
    });

    it('writes back when a step header is clicked directly', () => {
      host.linear = false;
      fixture.detectChanges();

      (headers()[2] as HTMLElement).click();
      fixture.detectChanges();

      expect(host.activeStepIndex).toBe(2);
    });
  });

  describe('completion', () => {
    it('emits completed once when Finish is clicked on the last step', () => {
      host.linear = false;
      host.activeStepIndex = 2;
      fixture.detectChanges();

      finishButton()?.click();
      fixture.detectChanges();

      expect(host.completions).toBe(1);
      // Finishing navigates nowhere — the index is unchanged.
      expect(host.activeStepIndex).toBe(2);
    });

    it('disables Finish in linear mode until the last step is completed', () => {
      host.complete('customer', 'items');
      host.activeStepIndex = 2;
      fixture.detectChanges();

      expect(finishButton()?.disabled).toBe(true);

      host.complete('review');
      fixture.detectChanges();

      expect(finishButton()?.disabled).toBe(false);
      finishButton()?.click();
      expect(host.completions).toBe(1);
    });
  });

  describe('footer button states', () => {
    it('disables Back on the first step only', () => {
      host.linear = false;
      host.activeStepIndex = 1;
      fixture.detectChanges();

      expect(backButtons()[0].disabled).toBe(true);
      expect(backButtons()[1].disabled).toBe(false);
      expect(backButtons()[2].disabled).toBe(false);
    });
  });
});
