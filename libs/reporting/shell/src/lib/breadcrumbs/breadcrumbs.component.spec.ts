import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BreadcrumbItem } from './breadcrumb-item';
import { BreadcrumbsComponent } from './breadcrumbs.component';

const TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Reports', path: '/reports' },
  { label: 'Customers', path: '/reports/customers' },
  { label: 'Acme Manufacturing' },
];

@Component({
  imports: [BreadcrumbsComponent],
  template: `<rpt-breadcrumbs [items]="items" />`,
})
class HostComponent {
  items: readonly BreadcrumbItem[] = TRAIL;
}

describe('BreadcrumbsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a labelled nav wrapping an ordered list', () => {
    const nav = element().querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(nav?.querySelector('ol')).toBeTruthy();
    expect(element().querySelectorAll('ol > li')).toHaveLength(3);
  });

  it('renders intermediate items as router links and the last as plain text', () => {
    const links = Array.from(element().querySelectorAll('a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'Reports',
      'Customers',
    ]);
    expect(links[0].getAttribute('href')).toBe('/reports');
    expect(links[1].getAttribute('href')).toBe('/reports/customers');

    const current = element().querySelector('[aria-current="page"]');
    expect(current?.tagName).toBe('SPAN');
    expect(current?.textContent?.trim()).toBe('Acme Manufacturing');
  });

  it('hides the separators from assistive technology', () => {
    const separators = Array.from(
      element().querySelectorAll('.rpt-breadcrumbs__separator'),
    );
    expect(separators).toHaveLength(2);
    for (const separator of separators) {
      expect(separator.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('renders an intermediate item without a path as plain text', () => {
    host.items = [{ label: 'Reports' }, { label: 'Invoices' }];
    fixture.detectChanges();

    expect(element().querySelectorAll('a')).toHaveLength(0);
    expect(
      element().querySelector('.rpt-breadcrumbs__text')?.textContent?.trim(),
    ).toBe('Reports');
    expect(
      element().querySelector('[aria-current="page"]')?.textContent?.trim(),
    ).toBe('Invoices');
  });

  it('renders a single item as the current page only — no links, no separators', () => {
    host.items = [{ label: 'Dashboard' }];
    fixture.detectChanges();

    expect(element().querySelectorAll('a')).toHaveLength(0);
    expect(element().querySelectorAll('.rpt-breadcrumbs__separator')).toHaveLength(0);
    expect(
      element().querySelector('[aria-current="page"]')?.textContent?.trim(),
    ).toBe('Dashboard');
  });

  it('renders an empty list without errors for an empty items array', () => {
    host.items = [];
    fixture.detectChanges();

    expect(element().querySelector('nav ol')).toBeTruthy();
    expect(element().querySelectorAll('ol > li')).toHaveLength(0);
  });
});
