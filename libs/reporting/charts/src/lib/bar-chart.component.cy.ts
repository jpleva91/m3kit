import { Component } from '@angular/core';

import { BarChartComponent, BarChartMode, BarChartSeries } from './bar-chart.component';

@Component({
  imports: [BarChartComponent],
  template: `
    <rpt-bar-chart
      [categories]="categories"
      [series]="series"
      [mode]="mode"
      [horizontal]="horizontal"
      ariaLabel="Invoices by status and quarter"
    />
  `,
})
class BarChartHostComponent {
  categories: readonly string[] = ['Q1', 'Q2'];
  series: readonly BarChartSeries[] = [
    { name: 'Paid', values: [3, 5] },
    { name: 'Overdue', values: [7, 5] },
  ];
  mode: BarChartMode = 'grouped';
  horizontal = false;
}

function mountBarChart(overrides: Partial<BarChartHostComponent> = {}) {
  return cy.mount(BarChartHostComponent, { componentProperties: overrides });
}

describe(BarChartComponent.name, () => {
  it('renders token-colored bars per category and series', () => {
    mountBarChart();
    cy.get('svg.rpt-bar-chart').should('have.attr', 'role', 'img');
    cy.get('.rpt-bar-chart__bar').should('have.length', 4);
    cy.get('.rpt-bar-chart__bar[data-series="0"]').should(
      'have.attr',
      'fill',
      'var(--app-chart-1)',
    );
    cy.get('.rpt-bar-chart__bar[data-series="1"]').should(
      'have.attr',
      'fill',
      'var(--app-chart-2)',
    );
    cy.get('.rpt-bar-chart__tick--category').should('have.length', 2).first().should('contain.text', 'Q1');
  });

  it('stacks segments whose heights sum to the scaled category total', () => {
    mountBarChart({ mode: 'stacked' });
    // Category sums are 10 → domain [0, 10] over a 200px-tall plot.
    cy.get('.rpt-bar-chart__bar[data-category="0"]').then(($bars) => {
      const total = [...$bars].reduce((sum, bar) => sum + Number(bar.getAttribute('height')), 0);
      expect(total).to.eq(200);
    });
    // Segments within a stack share one x and butt up against each other.
    cy.get('.rpt-bar-chart__bar[data-category="0"]').then(($bars) => {
      const [first, second] = [...$bars];
      expect(first.getAttribute('x')).to.eq(second.getAttribute('x'));
      expect(Number(second.getAttribute('y')) + Number(second.getAttribute('height'))).to.eq(
        Number(first.getAttribute('y')),
      );
    });
  });

  it('swaps axes in horizontal mode', () => {
    mountBarChart({ horizontal: true });
    cy.get('.rpt-bar-chart__bar[data-category="0"][data-series="0"]')
      .invoke('attr', 'x')
      .should('eq', '88');
    cy.get('.rpt-bar-chart__bar').each(($bar) => {
      expect(Number($bar.attr('width'))).to.be.greaterThan(0);
    });
  });

  it('renders an empty accessible SVG without data', () => {
    mountBarChart({ categories: [], series: [] });
    cy.get('svg.rpt-bar-chart').should('have.attr', 'role', 'img');
    cy.get('.rpt-bar-chart__bar').should('not.exist');
  });

  it('sizes the viewBox to the measured host width (1 unit = 1 CSS px)', () => {
    mountBarChart();
    cy.get('svg.rpt-bar-chart').should(($svg) => {
      const width = Math.round($svg[0].getBoundingClientRect().width);
      expect(width).to.be.greaterThan(0);
      expect($svg.attr('viewBox')).to.eq(`0 0 ${width} 240`);
    });
  });
});
