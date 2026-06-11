import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHeaderComponent } from './page-header.component';

@Component({
  imports: [PageHeaderComponent],
  template: `
    <rpt-page-header [title]="title" [subtitle]="subtitle">
      @if (withActions) {
        <button rptPageHeaderActions type="button" class="probe-action">
          Export
        </button>
      }
    </rpt-page-header>
  `,
})
class HostComponent {
  title = 'Invoices';
  subtitle = '';
  withActions = false;
}

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title as exactly one h1 in the display slot', () => {
    const headings = element().querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('Invoices');
    expect(headings[0].classList).toContain('rpt-page-header__title');
  });

  it('omits the subtitle element when no subtitle is given', () => {
    expect(element().querySelector('.rpt-page-header__subtitle')).toBeNull();
  });

  it('renders the optional subtitle beneath the title', () => {
    host.subtitle = 'Billing period June 2026';
    fixture.detectChanges();

    expect(
      element().querySelector('.rpt-page-header__subtitle')?.textContent?.trim(),
    ).toBe('Billing period June 2026');
  });

  it('projects actions into the end-aligned actions region', () => {
    host.withActions = true;
    fixture.detectChanges();

    expect(
      element().querySelector('.rpt-page-header__actions .probe-action'),
    ).toBeTruthy();
  });
});
