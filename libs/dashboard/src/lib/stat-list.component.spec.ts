import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatListComponent, StatListItem } from './stat-list.component';

@Component({
  imports: [StatListComponent],
  template: `<m3k-stat-list [items]="items" [dense]="dense" [currencyCode]="currencyCode" />`,
})
class HostComponent {
  items: readonly StatListItem[] = [
    { label: 'Invoices issued', value: 142 },
    { label: 'Total billed', value: 1284902.44, format: 'currency', delta: 4.2 },
  ];
  dense = false;
  currencyCode = 'USD';
}

describe('StatListComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const rows = (): readonly Element[] =>
    Array.from(element().querySelectorAll('.m3k-stat-list__row'));
  const text = (row: Element, selector: string): string | undefined =>
    row.querySelector(selector)?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one row per item with the label and value', () => {
    expect(rows().length).toBe(2);
    expect(text(rows()[0], '.m3k-stat-list__label')).toBe('Invoices issued');
    expect(text(rows()[0], '.m3k-stat-list__value')).toBe('142');
  });

  it('formats numeric values as currency and percent', () => {
    host.items = [
      { label: 'Total billed', value: 1284902.44, format: 'currency' },
      { label: 'Collection rate', value: 0.866, format: 'percent' },
    ];
    fixture.detectChanges();

    expect(text(rows()[0], '.m3k-stat-list__value')).toBe('$1,284,902.44');
    expect(text(rows()[1], '.m3k-stat-list__value')).toBe('87%');
  });

  it('renders plain and unformatted numbers as-is', () => {
    host.items = [
      { label: 'Open orders', value: 1280, format: 'plain' },
      { label: 'Open tickets', value: 1042 },
    ];
    fixture.detectChanges();

    expect(text(rows()[0], '.m3k-stat-list__value')).toBe('1280');
    expect(text(rows()[1], '.m3k-stat-list__value')).toBe('1042');
  });

  it('leaves string values untouched regardless of format', () => {
    host.items = [{ label: 'Status', value: 'n/a', format: 'currency' }];
    fixture.detectChanges();

    expect(text(rows()[0], '.m3k-stat-list__value')).toBe('n/a');
  });

  it('hides the delta when omitted', () => {
    expect(rows()[0].querySelector('.m3k-stat-list__delta')).toBeNull();
  });

  it('renders a signed positive delta with the up modifier', () => {
    const delta = rows()[1].querySelector('.m3k-stat-list__delta');
    expect(delta?.classList).toContain('m3k-stat-list__delta--up');
    expect(delta?.textContent?.trim()).toBe('+4.2');
  });

  it('renders a signed negative delta with the down modifier', () => {
    host.items = [{ label: 'Overdue balance', value: 86240.55, format: 'currency', delta: -2.1 }];
    fixture.detectChanges();

    const delta = rows()[0].querySelector('.m3k-stat-list__delta');
    expect(delta?.classList).toContain('m3k-stat-list__delta--down');
    expect(delta?.textContent?.trim()).toBe('-2.1');
  });

  it('renders a zero delta without a sentiment modifier', () => {
    host.items = [{ label: 'Refund rate', value: 0.042, format: 'percent', delta: 0 }];
    fixture.detectChanges();

    const delta = rows()[0].querySelector('.m3k-stat-list__delta');
    expect(delta?.classList).not.toContain('m3k-stat-list__delta--up');
    expect(delta?.classList).not.toContain('m3k-stat-list__delta--down');
    expect(delta?.textContent?.trim()).toBe('+0');
  });

  it('toggles the dense modifier', () => {
    expect(element().querySelector('.m3k-stat-list--dense')).toBeNull();

    host.dense = true;
    fixture.detectChanges();
    expect(element().querySelector('.m3k-stat-list--dense')).not.toBeNull();
  });

  it('honors the currency code', () => {
    host.items = [{ label: 'Total billed', value: 1200, format: 'currency' }];
    host.currencyCode = 'EUR';
    fixture.detectChanges();

    expect(text(rows()[0], '.m3k-stat-list__value')).toBe('€1,200.00');
  });
});
