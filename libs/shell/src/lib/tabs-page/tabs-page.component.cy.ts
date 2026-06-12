import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  TabsPageComponent,
  TabsPagePanelDirective,
  TabsPageTab,
} from './tabs-page.component';

const TABS: readonly TabsPageTab[] = [
  { id: 'overview', label: 'Overview', icon: 'receipt_long' },
  { id: 'line-items', label: 'Line items' },
  { id: 'activity', label: 'Activity', badge: 3 },
];

@Component({
  imports: [TabsPageComponent, TabsPagePanelDirective],
  template: `
    <m3k-tabs-page
      [tabs]="tabs"
      [activeTabId]="activeTabId"
      (activeTabIdChange)="onActiveTabIdChange($event)"
    >
      <ng-template m3kTabPanel="overview">
        <p class="probe-overview">INV-2041 · Acme Manufacturing · USD 12,480.00</p>
      </ng-template>
      <ng-template m3kTabPanel="line-items">
        <p class="probe-line-items">14 line items</p>
      </ng-template>
      <ng-template m3kTabPanel="activity">
        <p class="probe-activity">3 new events</p>
      </ng-template>
    </m3k-tabs-page>
  `,
})
class TabsPageHostComponent {
  tabs: readonly TabsPageTab[] = TABS;
  activeTabId = '';

  onActiveTabIdChange(id: string): void {
    this.activeTabId = id;
  }
}

function mountTabsPage(activeTabId = '') {
  return cy.mount(TabsPageHostComponent, {
    componentProperties: { activeTabId },
    providers: [provideNoopAnimations()],
  });
}

describe(TabsPageComponent.name, () => {
  it('renders one tab per entry with the first selected and its panel stamped', () => {
    mountTabsPage();
    cy.get('[role="tab"]').should('have.length', 3);
    cy.get('[role="tab"]')
      .first()
      .should('have.attr', 'aria-selected', 'true');
    cy.get('.probe-overview').should('contain.text', 'INV-2041');
    // Lazy panels: inactive content is not in the DOM yet.
    cy.get('.probe-line-items').should('not.exist');
  });

  it('emits the clicked id and switches the visible panel', () => {
    mountTabsPage().then(({ component }) => {
      cy.spy(component, 'onActiveTabIdChange').as('activeTabIdChange');
    });

    cy.contains('[role="tab"]', 'Line items').click();
    cy.get('@activeTabIdChange').should(
      'have.been.calledOnceWithExactly',
      'line-items',
    );
    cy.contains('[role="tab"]', 'Line items').should(
      'have.attr',
      'aria-selected',
      'true',
    );
    cy.get('.probe-line-items').should('be.visible');
    // Lazy panels are destroyed on deactivation, not just hidden.
    cy.get('.probe-overview').should('not.exist');

    cy.contains('[role="tab"]', 'Activity').click();
    cy.get('@activeTabIdChange').should(
      'have.been.calledWithExactly',
      'activity',
    );
    cy.get('.probe-activity').should('be.visible');
  });

  it('honors a bound activeTabId on mount', () => {
    mountTabsPage('activity');
    cy.contains('[role="tab"]', 'Activity').should(
      'have.attr',
      'aria-selected',
      'true',
    );
    cy.get('.probe-activity').should('be.visible');
  });

  it('renders the label badge and the leading icon', () => {
    mountTabsPage();
    cy.contains('[role="tab"]', 'Activity')
      .find('.mat-badge-content')
      .should('have.text', '3')
      .and('be.visible');
    cy.get('[role="tab"]')
      .first()
      .find('mat-icon')
      .should('contain.text', 'receipt_long');
  });
});
