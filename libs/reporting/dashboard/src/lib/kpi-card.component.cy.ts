import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KpiCardComponent } from './kpi-card.component';

@Component({
  imports: [KpiCardComponent],
  template: `
    <rpt-kpi-card
      [label]="label"
      [value]="value"
      [format]="format"
      [delta]="delta"
      [sparkline]="sparkline"
      icon="payments"
    />
  `,
})
class KpiCardHostComponent {
  label = 'Total revenue';
  value: string | number = 384200;
  format: 'number' | 'currency' | 'percent' | null = 'currency';
  delta: number | null = 12;
  sparkline: readonly number[] | null = [3, 5, 4, 8, 7, 9];
}

function mountKpiCard(overrides: Partial<KpiCardHostComponent> = {}) {
  return cy.mount(KpiCardHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(KpiCardComponent.name, () => {
  it('renders the label and the currency-formatted value', () => {
    mountKpiCard();
    cy.get('.rpt-kpi-card__label').should('have.text', 'Total revenue');
    cy.get('.rpt-kpi-card__value').should('contain.text', '$384,200.00');
  });

  it('renders a positive delta with an upward arrow', () => {
    mountKpiCard({ delta: 12 });
    cy.get('.rpt-kpi-card__delta')
      .should('have.class', 'rpt-kpi-card__delta--up')
      .and('contain.text', '+12');
    cy.get('.rpt-kpi-card__delta-icon').should('contain.text', 'arrow_upward');
  });

  it('renders a negative delta with a downward arrow', () => {
    mountKpiCard({ delta: -3.5 });
    cy.get('.rpt-kpi-card__delta')
      .should('have.class', 'rpt-kpi-card__delta--down')
      .and('contain.text', '-3.5');
    cy.get('.rpt-kpi-card__delta-icon').should('contain.text', 'arrow_downward');
  });

  it('hides the delta entirely when it is null', () => {
    mountKpiCard({ delta: null });
    cy.get('.rpt-kpi-card__delta').should('not.exist');
  });

  it('draws the sparkline as an inline SVG polyline', () => {
    mountKpiCard();
    cy.get('svg.rpt-kpi-card__sparkline')
      .should('exist')
      .find('polyline')
      .invoke('attr', 'points')
      .should('match', /^(\d+(\.\d+)?,\d+(\.\d+)?\s?)+$/);
  });

  it('omits the sparkline when fewer than two points are given', () => {
    mountKpiCard({ sparkline: [42] });
    cy.get('svg.rpt-kpi-card__sparkline').should('not.exist');
  });
});
