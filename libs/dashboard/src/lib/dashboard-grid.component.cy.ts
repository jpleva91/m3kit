import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DashboardGridComponent, GridSpanDirective } from './dashboard-grid.component';

@Component({
  imports: [DashboardGridComponent, GridSpanDirective],
  template: `
    <m3k-dashboard-grid [minColumnWidth]="minColumnWidth" [gap]="gap">
      <div class="cell cell--plain">Plain</div>
      <div class="cell cell--span" [m3kGridSpan]="2">Span 2</div>
      <div class="cell cell--full" m3kGridSpan="full">Full row</div>
    </m3k-dashboard-grid>
  `,
})
class DashboardGridHostComponent {
  minColumnWidth = '16rem';
  gap = '1rem';
}

function mountDashboardGrid(overrides: Partial<DashboardGridHostComponent> = {}) {
  return cy.mount(DashboardGridHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(DashboardGridComponent.name, () => {
  it('lays children out on a CSS grid with the configured gap', () => {
    mountDashboardGrid({ gap: '2rem' });
    cy.get('m3k-dashboard-grid')
      .should('have.css', 'display', 'grid')
      .and('have.css', 'gap', '32px');
  });

  it('exposes the minimum column width as a custom property on the host', () => {
    mountDashboardGrid({ minColumnWidth: '14rem' });
    cy.get('m3k-dashboard-grid').should(($grid) => {
      const value = getComputedStyle($grid[0])
        .getPropertyValue('--m3k-dashboard-grid-min-column-width')
        .trim();
      expect(value).to.equal('14rem');
    });
  });

  it('spans a child across the given number of columns via m3kGridSpan', () => {
    mountDashboardGrid();
    cy.get('.cell--span').should(($cell) => {
      expect($cell[0].style.gridColumn).to.equal('span 2');
    });
  });

  it('stretches a full-span child across the entire row', () => {
    mountDashboardGrid();
    cy.get('.cell--full').should(($cell) => {
      expect($cell[0].style.gridColumn).to.equal('1 / -1');
    });
    // In a wide viewport the full-span cell must be wider than a plain cell.
    cy.viewport(1200, 600);
    cy.get('.cell--full').invoke('outerWidth').then((fullWidth) => {
      cy.get('.cell--plain')
        .invoke('outerWidth')
        .should('be.lessThan', Number(fullWidth));
    });
  });

  it('leaves unspanned children on a single column track', () => {
    mountDashboardGrid();
    cy.get('.cell--plain').should(($cell) => {
      expect($cell[0].style.gridColumn).to.equal('');
    });
  });
});
