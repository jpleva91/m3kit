import { Component } from '@angular/core';

import { DonutChartComponent, DonutChartSlice } from './donut-chart.component';

@Component({
  imports: [DonutChartComponent],
  template: `
    <m3k-donut-chart
      [slices]="slices"
      [centerLabel]="centerLabel"
      [centerValue]="centerValue"
      ariaLabel="Invoices by status"
    />
  `,
})
class DonutChartHostComponent {
  slices: readonly DonutChartSlice[] = [
    { label: 'Paid', value: 96 },
    { label: 'Sent', value: 34 },
    { label: 'Overdue', value: 12 },
  ];
  centerLabel: string | null = null;
  centerValue: string | null = null;
}

function mountDonutChart(overrides: Partial<DonutChartHostComponent> = {}) {
  return cy.mount(DonutChartHostComponent, { componentProperties: overrides });
}

describe(DonutChartComponent.name, () => {
  it('renders one token-colored arc per slice', () => {
    mountDonutChart();
    cy.get('svg.m3k-donut-chart')
      .should('have.attr', 'role', 'img')
      .and('have.attr', 'aria-label', 'Invoices by status');
    cy.get('.m3k-donut-chart__slice').should('have.length', 3);
    cy.get('.m3k-donut-chart__slice[data-slice="Paid"]').should(
      'have.attr',
      'stroke',
      'var(--app-chart-1)',
    );
  });

  it('shows the center value and label', () => {
    mountDonutChart({ centerValue: '142', centerLabel: 'Invoices' });
    cy.get('.m3k-donut-chart__center-value').should('be.visible').and('contain.text', '142');
    cy.get('.m3k-donut-chart__center-label').should('be.visible').and('contain.text', 'Invoices');
  });

  it('hides center text when not provided', () => {
    mountDonutChart();
    cy.get('.m3k-donut-chart__center-value').should('not.exist');
    cy.get('.m3k-donut-chart__center-label').should('not.exist');
  });

  it('covers the full circle: slice percentages sum to 100', () => {
    mountDonutChart();
    cy.get('.m3k-donut-chart__slice').then(($slices) => {
      const total = [...$slices].reduce(
        (sum, slice) => sum + Number(slice.getAttribute('stroke-dasharray')?.split(' ')[0]),
        0,
      );
      expect(total).to.be.closeTo(100, 0.05);
    });
  });
});
