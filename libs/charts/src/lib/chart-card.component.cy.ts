import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ChartCardComponent } from './chart-card.component';
import { ChartLegendComponent } from './chart-legend.component';
import { LineChartComponent, LineChartSeries } from './line-chart.component';

@Component({
  imports: [ChartCardComponent, ChartLegendComponent, LineChartComponent],
  template: `
    <m3k-chart-card
      title="Revenue"
      subtitle="Last 6 months"
      [loading]="loading"
      [empty]="empty"
      emptyMessage="Nothing invoiced yet."
    >
      <m3k-line-chart [series]="series" ariaLabel="Revenue by month" />
      <m3k-chart-legend m3kChartCardLegend [items]="[{ label: 'Revenue', colorIndex: 0 }]" />
    </m3k-chart-card>
  `,
})
class ChartCardHostComponent {
  loading = false;
  empty = false;
  series: readonly LineChartSeries[] = [
    {
      name: 'Revenue',
      points: [
        { x: 'Jan', y: 4200 },
        { x: 'Feb', y: 5100 },
        { x: 'Mar', y: 4800 },
      ],
    },
  ];
}

function mountChartCard(overrides: Partial<ChartCardHostComponent> = {}) {
  return cy.mount(ChartCardHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(ChartCardComponent.name, () => {
  it('renders the title, subtitle, projected chart, and legend', () => {
    mountChartCard();
    cy.get('h2.m3k-chart-card__title').should('have.text', 'Revenue');
    cy.get('.m3k-chart-card__subtitle').should('contain.text', 'Last 6 months');
    cy.get('m3k-line-chart svg').should('exist');
    cy.get('.m3k-chart-card__legend .m3k-chart-legend__label').should('have.text', 'Revenue');
  });

  it('shows a progress bar instead of the chart while loading', () => {
    mountChartCard({ loading: true });
    cy.get('mat-progress-bar.m3k-chart-card__progress').should('be.visible');
    cy.get('m3k-line-chart').should('not.exist');
  });

  it('shows the empty message instead of the chart when empty', () => {
    mountChartCard({ empty: true });
    cy.get('.m3k-chart-card__empty').should('have.text', 'Nothing invoiced yet.');
    cy.get('m3k-line-chart').should('not.exist');
    cy.get('mat-progress-bar').should('not.exist');
  });
});
