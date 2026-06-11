import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KpiStripComponent, KpiStripItem } from './kpi-strip.component';

const DEFAULT_ITEMS: readonly KpiStripItem[] = [
  { label: 'Total revenue', value: 1284902.44, format: 'currency', delta: 4.2 },
  { label: 'Open invoices', value: 38, format: 'number', delta: -6, sparkline: [3, 5, 4, 8] },
  { label: 'Collection rate', value: 0.92, format: 'percent' },
];

@Component({
  imports: [KpiStripComponent],
  template: `<rpt-kpi-strip [items]="items" [currencyCode]="currencyCode" />`,
})
class KpiStripHostComponent {
  items: readonly KpiStripItem[] = DEFAULT_ITEMS;
  currencyCode = 'USD';
}

function mountKpiStrip(overrides: Partial<KpiStripHostComponent> = {}) {
  return cy.mount(KpiStripHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(KpiStripComponent.name, () => {
  it('renders one readout per item with formatted values', () => {
    mountKpiStrip();
    cy.get('.rpt-kpi-strip__readout').should('have.length', 3);
    cy.get('.rpt-kpi-strip__label').first().should('have.text', 'Total revenue');
    cy.get('.rpt-kpi-strip__value').eq(0).should('have.text', '$1,284,902.44');
    cy.get('.rpt-kpi-strip__value').eq(1).should('have.text', '38');
    cy.get('.rpt-kpi-strip__value').eq(2).should('have.text', '92%');
  });

  it('renders a positive delta with an upward arrow and explicit sign', () => {
    mountKpiStrip();
    cy.get('.rpt-kpi-strip__readout')
      .eq(0)
      .find('.rpt-kpi-strip__delta')
      .should('have.class', 'rpt-kpi-strip__delta--up')
      .and('contain.text', '+4.2');
    cy.get('.rpt-kpi-strip__readout')
      .eq(0)
      .find('.rpt-kpi-strip__delta-icon')
      .should('contain.text', 'arrow_upward');
  });

  it('renders a negative delta with a downward arrow', () => {
    mountKpiStrip();
    cy.get('.rpt-kpi-strip__readout')
      .eq(1)
      .find('.rpt-kpi-strip__delta')
      .should('have.class', 'rpt-kpi-strip__delta--down')
      .and('contain.text', '-6');
    cy.get('.rpt-kpi-strip__readout')
      .eq(1)
      .find('.rpt-kpi-strip__delta-icon')
      .should('contain.text', 'arrow_downward');
  });

  it('hides the delta entirely when omitted', () => {
    mountKpiStrip();
    cy.get('.rpt-kpi-strip__readout').eq(2).find('.rpt-kpi-strip__delta').should('not.exist');
  });

  it('draws the sparkline as an inline SVG polyline', () => {
    mountKpiStrip();
    cy.get('.rpt-kpi-strip__readout')
      .eq(1)
      .find('svg.rpt-kpi-strip__sparkline polyline')
      .invoke('attr', 'points')
      .should('match', /^(\d+(\.\d+)?,\d+(\.\d+)?\s?)+$/);
  });

  it('omits the sparkline when fewer than two points are given', () => {
    mountKpiStrip({
      items: [{ label: 'Open invoices', value: 38, sparkline: [42] }],
    });
    cy.get('svg.rpt-kpi-strip__sparkline').should('not.exist');
  });

  it('formats currency with the configured currency code', () => {
    mountKpiStrip({
      items: [{ label: 'Total revenue', value: 1000, format: 'currency' }],
      currencyCode: 'EUR',
    });
    cy.get('.rpt-kpi-strip__value').should('have.text', '€1,000.00');
  });
});
