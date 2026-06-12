import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSectionComponent, FormSectionHeadingLevel } from './form-section.component';

@Component({
  imports: [FormSectionComponent],
  template: `
    <m3k-form-section [title]="title" [description]="description" [headingLevel]="headingLevel">
      <p class="projected">Projected fields</p>
    </m3k-form-section>
  `,
})
class HostComponent {
  title = 'Shipping address';
  description = '';
  headingLevel: FormSectionHeadingLevel = 3;
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

  it('renders the heading at level 3 by default', () => {
    const heading = element.querySelector('.m3k-form-section__title');
    expect(heading?.textContent).toContain('Shipping address');
    expect(heading?.getAttribute('role')).toBe('heading');
    expect(heading?.getAttribute('aria-level')).toBe('3');
  });

  it('renders the configured heading level', () => {
    host.headingLevel = 2;
    fixture.detectChanges();

    expect(
      element.querySelector('.m3k-form-section__title')?.getAttribute('aria-level'),
    ).toBe('2');
  });

  it('hides the description until one is provided', () => {
    expect(element.querySelector('.m3k-form-section__description')).toBeNull();

    host.description = 'Where orders are delivered.';
    fixture.detectChanges();

    expect(
      element.querySelector('.m3k-form-section__description')?.textContent,
    ).toContain('Where orders are delivered.');
  });

  it('projects content into the section body', () => {
    const projected = element.querySelector('.m3k-form-section__content .projected');
    expect(projected?.textContent).toContain('Projected fields');
  });
});
