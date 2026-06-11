import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { FormSectionComponent } from './form-section.component';

@Component({
  imports: [FormSectionComponent],
  template: `
    <rpt-form-section [title]="title" [description]="description">
      <input class="projected-field" aria-label="Customer name" />
    </rpt-form-section>
  `,
})
class FormSectionHostComponent {
  title = 'Billing';
  description = 'Where invoices are sent.';
}

function mountFormSection(overrides: Partial<FormSectionHostComponent> = {}) {
  return cy.mount(FormSectionHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(FormSectionComponent.name, () => {
  it('renders the section heading', () => {
    mountFormSection();
    cy.get('.rpt-form-section__title')
      .should('contain.text', 'Billing')
      .and('have.attr', 'role', 'heading')
      .and('have.attr', 'aria-level', '3');
  });

  it('renders the description under the heading when provided', () => {
    mountFormSection();
    cy.get('.rpt-form-section__description').should('have.text', 'Where invoices are sent.');
  });

  it('omits the description paragraph when empty', () => {
    mountFormSection({ description: '' });
    cy.get('.rpt-form-section__description').should('not.exist');
  });

  it('projects fields into the content slot', () => {
    mountFormSection();
    cy.get('.rpt-form-section__content .projected-field').should('be.visible');
  });
});
