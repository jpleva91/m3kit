import { Component } from '@angular/core';

import { LineChartComponent, LineChartSeries } from './line-chart.component';

@Component({
  imports: [LineChartComponent],
  template: `
    <rpt-line-chart [series]="series" [area]="area" ariaLabel="Revenue and costs by month" />
  `,
})
class LineChartHostComponent {
  series: readonly LineChartSeries[] = [
    {
      name: 'Revenue',
      points: [
        { x: 'Jan', y: 4200 },
        { x: 'Feb', y: 5100 },
        { x: 'Mar', y: 4800 },
        { x: 'Apr', y: 6200 },
      ],
    },
    {
      name: 'Costs',
      points: [
        { x: 'Jan', y: 3100 },
        { x: 'Feb', y: 3300 },
        { x: 'Mar', y: 3500 },
        { x: 'Apr', y: 3400 },
      ],
    },
  ];
  area = false;
}

function mountLineChart(overrides: Partial<LineChartHostComponent> = {}) {
  return cy.mount(LineChartHostComponent, { componentProperties: overrides });
}

describe(LineChartComponent.name, () => {
  it('renders one token-colored path per series', () => {
    mountLineChart();
    cy.get('svg.rpt-line-chart')
      .should('have.attr', 'role', 'img')
      .and('have.attr', 'aria-label', 'Revenue and costs by month');
    cy.get('.rpt-line-chart__line').should('have.length', 2);
    cy.get('.rpt-line-chart__line').eq(0).should('have.attr', 'stroke', 'var(--app-chart-1)');
    cy.get('.rpt-line-chart__line').eq(1).should('have.attr', 'stroke', 'var(--app-chart-2)');
  });

  it('renders axes, grid lines, and first/last x labels', () => {
    mountLineChart();
    cy.get('.rpt-line-chart__axis').should('have.length', 2);
    cy.get('.rpt-line-chart__grid-line').should('have.length.greaterThan', 2);
    cy.get('.rpt-line-chart__tick--x').first().should('contain.text', 'Jan');
    cy.get('.rpt-line-chart__tick--x').last().should('contain.text', 'Apr');
  });

  it('adds translucent area fills when area is on', () => {
    mountLineChart({ area: true });
    cy.get('.rpt-line-chart__area')
      .should('have.length', 2)
      .first()
      .invoke('attr', 'fill')
      .should('eq', 'color-mix(in srgb, var(--app-chart-1) 20%, transparent)');
  });

  it('renders an empty accessible SVG without data', () => {
    mountLineChart({ series: [] });
    cy.get('svg.rpt-line-chart').should('have.attr', 'role', 'img');
    cy.get('.rpt-line-chart__line').should('not.exist');
  });

  it('sizes the viewBox to the measured host width (1 unit = 1 CSS px)', () => {
    mountLineChart();
    cy.get('svg.rpt-line-chart').should(($svg) => {
      const width = Math.round($svg[0].getBoundingClientRect().width);
      expect(width).to.be.greaterThan(0);
      expect($svg.attr('viewBox')).to.eq(`0 0 ${width} 240`);
    });
  });
});
