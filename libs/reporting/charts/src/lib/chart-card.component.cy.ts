import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ChartCardComponent } from './chart-card.component';
import { ChartLegendComponent } from './chart-legend.component';
import { LineChartComponent, LineChartSeries } from './line-chart.component';

@Component({
  imports: [ChartCardComponent, ChartLegendComponent, LineChartComponent],
  template: `
    <rpt-chart-card
      title="Revenue"
      subtitle="Last 6 months"
      [loading]="loading"
      [empty]="empty"
      emptyMessage="Nothing invoiced yet."
    >
      <rpt-line-chart [series]="series" ariaLabel="Revenue by month" />
      <rpt-chart-legend rptChartCardLegend [items]="[{ label: 'Revenue', colorIndex: 0 }]" />
    </rpt-chart-card>
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
    cy.get('h2.rpt-chart-card__title').should('have.text', 'Revenue');
    cy.get('.rpt-chart-card__subtitle').should('contain.text', 'Last 6 months');
    cy.get('rpt-line-chart svg').should('exist');
    cy.get('.rpt-chart-card__legend .rpt-chart-legend__label').should('have.text', 'Revenue');
  });

  it('shows a progress bar instead of the chart while loading', () => {
    mountChartCard({ loading: true });
    cy.get('mat-progress-bar.rpt-chart-card__progress').should('be.visible');
    cy.get('rpt-line-chart').should('not.exist');
  });

  it('shows the empty message instead of the chart when empty', () => {
    mountChartCard({ empty: true });
    cy.get('.rpt-chart-card__empty').should('have.text', 'Nothing invoiced yet.');
    cy.get('rpt-line-chart').should('not.exist');
    cy.get('mat-progress-bar').should('not.exist');
  });
});
