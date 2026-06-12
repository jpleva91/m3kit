import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailCardComponent, DetailCardRow } from './detail-card.component';

@Component({
  imports: [DetailCardComponent],
  template: `
    <m3k-detail-card [title]="title" [subtitle]="subtitle" [rows]="rows">
      <button m3kDetailCardActions class="header-action" type="button">Refresh</button>
      <a m3kDetailCardFooter class="footer-link" href="#">View all</a>
    </m3k-detail-card>
  `,
})
class HostComponent {
  title = 'Latest invoice';
  subtitle: string | null = null;
  rows: readonly DetailCardRow[] = [
    { label: 'Number', value: 'INV-2026-0042' },
    { label: 'Amount', value: 1250 },
  ];
}

describe('DetailCardComponent', () => {
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

  it('renders the title as an h2 and hides the subtitle when null', () => {
    const title = element().querySelector('h2[mat-card-title]');
    expect(title?.textContent).toBe('Latest invoice');
    expect(title?.classList).toContain('m3k-detail-card__title');
    expect(element().querySelector('mat-card-subtitle')).toBeNull();
  });

  it('renders the subtitle when set', () => {
    host.subtitle = 'INV-2026-0042';
    fixture.detectChanges();
    expect(element().querySelector('mat-card-subtitle')?.textContent).toBe('INV-2026-0042');
  });

  it('renders one label/value row per entry', () => {
    const rows = element().querySelectorAll('.m3k-detail-card__row');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('dt')?.textContent).toBe('Number');
    expect(rows[0].querySelector('dd')?.textContent).toBe('INV-2026-0042');
    expect(rows[1].querySelector('dd')?.textContent).toBe('1250');
  });

  it('shows a placeholder when rows is empty', () => {
    host.rows = [];
    fixture.detectChanges();

    expect(element().querySelector('.m3k-detail-card__row')).toBeNull();
    expect(element().querySelector('.m3k-detail-card__empty')?.textContent).toBe(
      'No details available.',
    );
  });

  it('projects header actions and footer content into their slots', () => {
    expect(
      element().querySelector('.m3k-detail-card__actions .header-action')?.textContent,
    ).toBe('Refresh');
    expect(element().querySelector('.m3k-detail-card__footer .footer-link')?.textContent).toBe(
      'View all',
    );
  });
});
