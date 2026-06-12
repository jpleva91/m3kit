import { Component } from '@angular/core';
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
      <ng-template m3kStepPanel="customer">
        <p class="probe-customer">Cascade Outfitters · accounts&#64;cascade-outfitters.example</p>
        <button type="button" class="probe-confirm-customer" (click)="complete('customer')">
          Confirm customer
        </button>
      </ng-template>
      <ng-template m3kStepPanel="items">
        <p class="probe-items">3 lines · 18 units · $923.00</p>
        <button type="button" class="probe-confirm-items" (click)="complete('items')">
          Confirm items
        </button>
      </ng-template>
      <ng-template m3kStepPanel="review">
        <p class="probe-review">Submitting creates draft order ORD-10421.</p>
        <button type="button" class="probe-confirm-review" (click)="complete('review')">
          Confirm review
        </button>
      </ng-template>
      <ng-template m3kStepperFooterExtras>
        <span class="probe-extras">Draft saved</span>
      </ng-template>
    </m3k-stepper-flow>
    <span class="probe-index">{{ activeStepIndex }}</span>
    <span class="probe-completions">{{ completions }}</span>
  `,
})
class StepperFlowHostComponent {
  steps: readonly StepDefinition[] = ORDER_STEPS;
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  linear = true;
  activeStepIndex = 0;
  completions = 0;

  complete(id: string) {
    this.steps = this.steps.map((step) =>
      step.id === id ? { ...step, completed: true } : step,
    );
  }
}

function mountStepperFlow(overrides: Partial<StepperFlowHostComponent> = {}) {
  return cy.mount(StepperFlowHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(StepperFlowComponent.name, () => {
  it('walks the full order-entry flow: gate, Next, Back, Finish, events', () => {
    mountStepperFlow();

    // Three headers, first step active, its panel visible.
    cy.get('.mat-step-header').should('have.length', 3);
    cy.get('.mat-step-header').first().should('have.attr', 'aria-selected', 'true');
    cy.get('.probe-customer').should('be.visible');
    cy.get('.probe-extras').should('be.visible');

    // Linear gate: Next is disabled until the consumer marks the step done.
    cy.get('.m3k-stepper-flow__next:visible').should('be.disabled');
    cy.get('.probe-confirm-customer').click();
    cy.get('.m3k-stepper-flow__next:visible').should('be.enabled').click();

    // Step 2 active; the two-way index wrote back.
    cy.get('.probe-items').should('be.visible');
    cy.get('.probe-index').should('have.text', '1');

    // Back returns to step 1; Next again to step 2.
    cy.get('.m3k-stepper-flow__back:visible').should('be.enabled').click();
    cy.get('.probe-index').should('have.text', '0');
    cy.get('.m3k-stepper-flow__next:visible').click();
    cy.get('.probe-index').should('have.text', '1');

    // Complete items, advance to review.
    cy.get('.probe-confirm-items').click();
    cy.get('.m3k-stepper-flow__next:visible').click();
    cy.get('.probe-review').should('be.visible');
    cy.get('.probe-index').should('have.text', '2');

    // Finish honors the gate, then emits completed exactly once.
    cy.get('.m3k-stepper-flow__finish').should('be.disabled');
    cy.get('.probe-confirm-review').click();
    cy.get('.m3k-stepper-flow__finish').should('be.enabled').click();
    cy.get('.probe-completions').should('have.text', '1');
  });

  it('disables Back on the first step', () => {
    mountStepperFlow();
    cy.get('.m3k-stepper-flow__back:visible').should('be.disabled');
  });

  it('honors a preset activeStepIndex in a non-linear flow', () => {
    mountStepperFlow({ linear: false, activeStepIndex: 2 });
    cy.get('.probe-review').should('be.visible');
    cy.get('.mat-step-header').eq(2).should('have.attr', 'aria-selected', 'true');
  });

  it('renders the vertical orientation with per-step footers', () => {
    mountStepperFlow({ orientation: 'vertical' });
    cy.get('mat-stepper').should('have.class', 'mat-stepper-vertical');
    cy.get('.m3k-stepper-flow__footer').should('have.length', 3);
    cy.get('.probe-customer').should('be.visible');
  });
});
