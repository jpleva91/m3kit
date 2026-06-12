import { Component } from '@angular/core';

import { ChartLegendComponent, ChartLegendItem } from './chart-legend.component';

@Component({
  imports: [ChartLegendComponent],
  template: `<m3k-chart-legend [items]="items" />`,
})
class ChartLegendHostComponent {
  items: readonly ChartLegendItem[] = [
    { label: 'Paid', colorIndex: 0 },
    { label: 'Sent', colorIndex: 1 },
    { label: 'Overdue', colorIndex: 2 },
  ];
}

function mountLegend(overrides: Partial<ChartLegendHostComponent> = {}) {
  return cy.mount(ChartLegendHostComponent, { componentProperties: overrides });
}

describe(ChartLegendComponent.name, () => {
  it('renders one swatch-and-label row per item', () => {
    mountLegend();
    cy.get('.m3k-chart-legend__item').should('have.length', 3);
    cy.get('.m3k-chart-legend__label').first().should('have.text', 'Paid');
    cy.get('.m3k-chart-legend__swatch')
      .first()
      .should('have.attr', 'aria-hidden', 'true')
      .and('have.css', 'background')
      .then((background) => {
        // jsdom-free real browser resolves the token; just assert it set something.
        expect(String(background)).to.not.eq('');
      });
  });

  it('renders nothing for an empty item list', () => {
    mountLegend({ items: [] });
    cy.get('.m3k-chart-legend__item').should('not.exist');
  });
});
