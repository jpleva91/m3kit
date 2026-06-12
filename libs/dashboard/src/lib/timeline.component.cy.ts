import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TimelineComponent, TimelineEvent } from './timeline.component';

@Component({
  imports: [TimelineComponent],
  template: `<m3k-timeline [events]="events" />`,
})
class TimelineHostComponent {
  events: readonly TimelineEvent[] = [
    {
      id: 'evt-1',
      title: 'Ticket created',
      timestamp: '2026-05-28 09:14',
      description: 'Customer reported a failed export on the invoices report.',
      icon: 'confirmation_number',
    },
    {
      id: 'evt-2',
      title: 'Escalated to engineering',
      timestamp: '2026-05-28 11:02',
      kind: 'warning',
    },
    { id: 'evt-3', title: 'Fix deployed', timestamp: '2026-05-29 16:40', kind: 'success' },
  ];
}

function mountTimeline(overrides: Partial<TimelineHostComponent> = {}) {
  return cy.mount(TimelineHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(TimelineComponent.name, () => {
  it('renders the feed as an ordered list of events', () => {
    mountTimeline();
    cy.get('ol.m3k-timeline li.m3k-timeline__event').should('have.length', 3);
    cy.get('.m3k-timeline__title').first().should('have.text', 'Ticket created');
    cy.get('time.m3k-timeline__timestamp')
      .first()
      .should('contain.text', '2026-05-28 09:14')
      .and('have.attr', 'datetime', '2026-05-28 09:14');
  });

  it('tints markers by kind and defaults to info', () => {
    mountTimeline();
    cy.get('.m3k-timeline__marker').eq(0).should('have.class', 'm3k-timeline__marker--info');
    cy.get('.m3k-timeline__marker').eq(1).should('have.class', 'm3k-timeline__marker--warning');
    cy.get('.m3k-timeline__marker').eq(2).should('have.class', 'm3k-timeline__marker--success');
  });

  it('renders icons inside markers only when given', () => {
    mountTimeline();
    cy.get('.m3k-timeline__marker')
      .eq(0)
      .should('have.class', 'm3k-timeline__marker--with-icon')
      .find('.m3k-timeline__marker-icon')
      .should('contain.text', 'confirmation_number');
    cy.get('.m3k-timeline__marker').eq(1).find('.m3k-timeline__marker-icon').should('not.exist');
  });

  it('draws one fewer connector than events', () => {
    mountTimeline();
    cy.get('.m3k-timeline__connector').should('have.length', 2);
    cy.get('.m3k-timeline__event').last().find('.m3k-timeline__connector').should('not.exist');
  });
});
