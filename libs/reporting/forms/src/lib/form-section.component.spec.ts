import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSectionComponent } from './form-section.component';

@Component({
  imports: [FormSectionComponent],
  template: `
    <rpt-form-section [title]="title" [description]="description">
      <p class="projected">Projected fields</p>
    </rpt-form-section>
  `,
})
class HostComponent {
  title = 'Shipping address';
  description = '';
}

describe('FormSectionComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('renders the heading', () => {
    const heading = element.querySelector('.rpt-form-section__title');
    expect(heading?.textContent).toContain('Shipping address');
  });

  it('hides the description until one is provided', () => {
    expect(element.querySelector('.rpt-form-section__description')).toBeNull();

    host.description = 'Where orders are delivered.';
    fixture.detectChanges();

    expect(
      element.querySelector('.rpt-form-section__description')?.textContent,
    ).toContain('Where orders are delivered.');
  });

  it('projects content into the section body', () => {
    const projected = element.querySelector('.rpt-form-section__content .projected');
    expect(projected?.textContent).toContain('Projected fields');
  });
});
