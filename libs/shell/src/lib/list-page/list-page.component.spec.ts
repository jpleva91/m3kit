import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BreadcrumbItem } from '../breadcrumbs/breadcrumb-item';
import {
  ListPageComponent,
  ListPagePrimaryAction,
} from './list-page.component';

const TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Reports', path: '/reports' },
  { label: 'Invoices' },
];

@Component({
  imports: [ListPageComponent],
  template: `
    <m3k-list-page
      [title]="title"
      [description]="description"
      [breadcrumbs]="breadcrumbs"
      [primaryAction]="primaryAction"
      [empty]="empty"
      (primaryActionClick)="emissions = emissions + 1"
    >
      <div m3kListPageToolbar class="probe-toolbar">
        Status: overdue · Issued: Q2 2026
      </div>
      <ul class="probe-content">
        <li>INV-2041 — Acme Manufacturing — USD 12,480.00</li>
        <li>INV-2057 — Northwind Traders — USD 1,265.40</li>
      </ul>
      <div m3kListPageEmpty class="probe-empty">
        No invoices match the current filters.
      </div>
    </m3k-list-page>
  `,
})
class HostComponent {
  title = 'Invoices';
  description = 'Billing period June 2026';
  breadcrumbs: readonly BreadcrumbItem[] = TRAIL;
  primaryAction: ListPagePrimaryAction | undefined = {
    label: 'New invoice',
    icon: 'add',
  };
  empty = false;
  emissions = 0;
}

describe('ListPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const primaryButton = (): HTMLButtonElement | null =>
    element().querySelector<HTMLButtonElement>('.m3k-list-page__primary-action');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title and description through the page header', () => {
    expect(element().querySelector('h1')?.textContent?.trim()).toBe('Invoices');
    expect(
      element().querySelector('.m3k-page-header__subtitle')?.textContent?.trim(),
    ).toBe('Billing period June 2026');
  });

  it('renders the breadcrumb trail above the header when items are provided', () => {
    const nav = element().querySelector('nav[aria-label="Breadcrumb"]');
    expect(nav).not.toBeNull();
    expect(nav?.querySelectorAll('li')).toHaveLength(2);
    expect(nav?.querySelector('[aria-current="page"]')?.textContent).toBe(
      'Invoices',
    );
  });

  it('omits the breadcrumb nav when the trail is empty', () => {
    host.breadcrumbs = [];
    fixture.detectChanges();

    expect(element().querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
  });

  it('projects the toolbar slot and the default content slot', () => {
    expect(
      element()
        .querySelector('.m3k-list-page__toolbar .probe-toolbar')
        ?.textContent?.trim(),
    ).toContain('Status: overdue');
    expect(
      element().querySelector('.m3k-list-page__content .probe-content')
        ?.textContent,
    ).toContain('INV-2041');
  });

  it('renders the primary-action button with its label and icon', () => {
    const button = primaryButton();
    expect(button?.textContent).toContain('New invoice');
    expect(button?.querySelector('mat-icon')?.textContent?.trim()).toBe('add');
  });

  it('emits (primaryActionClick) on each button click', () => {
    primaryButton()?.click();
    primaryButton()?.click();

    expect(host.emissions).toBe(2);
  });

  it('omits the primary-action button when the input is undefined', () => {
    host.primaryAction = undefined;
    fixture.detectChanges();

    expect(primaryButton()).toBeNull();
    expect(host.emissions).toBe(0);
  });

  it('swaps content for the empty slot while empty is true, and back', () => {
    expect(element().querySelector('.probe-empty')).toBeNull();

    host.empty = true;
    fixture.detectChanges();

    expect(element().querySelector('.probe-content')).toBeNull();
    expect(
      element().querySelector('.m3k-list-page__empty .probe-empty')
        ?.textContent,
    ).toContain('No invoices match');

    host.empty = false;
    fixture.detectChanges();

    expect(element().querySelector('.probe-empty')).toBeNull();
    expect(element().querySelector('.probe-content')).not.toBeNull();
  });

  it('keeps the toolbar available while empty (filters may cause emptiness)', () => {
    host.empty = true;
    fixture.detectChanges();

    expect(element().querySelector('.probe-toolbar')).not.toBeNull();
  });
});
