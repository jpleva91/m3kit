import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerComponent, BannerSeverity } from './banner.component';

@Component({
  imports: [BannerComponent],
  template: `
    <m3k-banner [severity]="severity" [dismissible]="dismissible" (dismissed)="dismissals = dismissals + 1">
      3 invoices are overdue.
      <button m3kBannerAction class="banner-action" type="button">Review</button>
    </m3k-banner>
  `,
})
class HostComponent {
  severity: BannerSeverity = 'info';
  dismissible = false;
  dismissals = 0;
}

describe('BannerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const banner = (): HTMLElement | null => element().querySelector('.m3k-banner');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to info: severity class, info icon, role="status"', () => {
    expect(banner()?.classList).toContain('m3k-banner--info');
    expect(banner()?.getAttribute('role')).toBe('status');
    expect(element().querySelector('.m3k-banner__icon')?.textContent?.trim()).toBe('info');
  });

  it.each([
    ['info', 'status', 'info'],
    ['success', 'status', 'check_circle'],
    ['warning', 'alert', 'warning'],
    ['error', 'alert', 'error'],
  ] as const)('maps severity %s to role %s and icon %s', (severity, role, icon) => {
    host.severity = severity;
    fixture.detectChanges();

    expect(banner()?.classList).toContain(`m3k-banner--${severity}`);
    expect(banner()?.getAttribute('role')).toBe(role);
    expect(element().querySelector('.m3k-banner__icon')?.textContent?.trim()).toBe(icon);
  });

  it('projects the message and the action slot', () => {
    expect(element().querySelector('.m3k-banner__message')?.textContent).toContain(
      '3 invoices are overdue.',
    );
    expect(
      element().querySelector('.m3k-banner__action .banner-action')?.textContent,
    ).toBe('Review');
  });

  it('hides the dismiss button unless dismissible', () => {
    expect(element().querySelector('.m3k-banner__dismiss')).toBeNull();

    host.dismissible = true;
    fixture.detectChanges();
    expect(element().querySelector('.m3k-banner__dismiss')).not.toBeNull();
  });

  it('emits dismissed when the dismiss button is clicked', () => {
    host.dismissible = true;
    fixture.detectChanges();

    const dismiss = element().querySelector<HTMLButtonElement>('.m3k-banner__dismiss');
    dismiss?.click();
    fixture.detectChanges();

    expect(host.dismissals).toBe(1);
  });
});
