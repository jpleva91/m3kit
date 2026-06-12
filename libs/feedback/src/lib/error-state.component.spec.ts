import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorStateComponent } from './error-state.component';

@Component({
  imports: [ErrorStateComponent],
  template: `
    <m3k-error-state
      [icon]="icon"
      [title]="title"
      [description]="description"
      [details]="details"
      (retry)="retries = retries + 1"
    />
  `,
})
class HostComponent {
  icon = 'error';
  title = 'Could not load invoices';
  description: string | null = null;
  details: string | null = null;
  retries = 0;
}

@Component({
  imports: [ErrorStateComponent],
  template: `
    <m3k-error-state title="Could not load invoices">
      <button m3kErrorStateActions class="custom-action" type="button">Reload page</button>
    </m3k-error-state>
  `,
})
class ProjectingHostComponent {}

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, ProjectingHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title and the default error icon', () => {
    expect(element().querySelector('h3.m3k-error-state__title')?.textContent).toBe(
      'Could not load invoices',
    );
    expect(
      element().querySelector('.m3k-error-state__icon mat-icon')?.textContent?.trim(),
    ).toBe('error');
  });

  it('hides the description when null and shows it when set', () => {
    expect(element().querySelector('.m3k-error-state__description')).toBeNull();

    host.description = 'The invoice list did not respond.';
    fixture.detectChanges();
    expect(element().querySelector('.m3k-error-state__description')?.textContent).toBe(
      'The invoice list did not respond.',
    );
  });

  it('renders technical details collapsed inside a disclosure when set', () => {
    expect(element().querySelector('.m3k-error-state__details')).toBeNull();

    host.details = 'GET /api/invoices 503 (Service Unavailable)';
    fixture.detectChanges();

    const details = element().querySelector<HTMLDetailsElement>('details.m3k-error-state__details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toBe('Technical details');
    expect(details?.querySelector('pre')?.textContent).toBe(
      'GET /api/invoices 503 (Service Unavailable)',
    );
  });

  it('emits retry when the default Try again button is clicked', () => {
    const button = element().querySelector<HTMLButtonElement>('.m3k-error-state__retry');
    expect(button?.textContent?.trim()).toBe('Try again');

    button?.click();
    fixture.detectChanges();
    expect(host.retries).toBe(1);
  });

  it('replaces the default retry button with projected actions', () => {
    const projecting = TestBed.createComponent(ProjectingHostComponent);
    projecting.detectChanges();
    const projected = projecting.nativeElement as HTMLElement;

    expect(projected.querySelector('.m3k-error-state__retry')).toBeNull();
    expect(
      projected.querySelector('.m3k-error-state__actions .custom-action')?.textContent,
    ).toBe('Reload page');
  });
});
