import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiStripComponent, KpiStripItem } from './kpi-strip.component';

@Component({
  imports: [KpiStripComponent],
  template: `<rpt-kpi-strip [items]="items" [currencyCode]="currencyCode" />`,
})
class HostComponent {
  items: readonly KpiStripItem[] = [
    { label: 'Total revenue', value: 1284902.44, format: 'currency', delta: 4.2 },
    { label: 'Open invoices', value: 38, format: 'number', delta: 6 },
    { label: 'Overdue', value: 12, delta: -3 },
    { label: 'Health', value: 'nominal' },
  ];
  currencyCode = 'USD';
}

describe('KpiStripComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const readouts = (): readonly HTMLElement[] =>
    Array.from(element().querySelectorAll<HTMLElement>('.rpt-kpi-strip__readout'));
  const text = (parent: Element, selector: string): string | undefined =>
    parent.querySelector(selector)?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one readout per item with its label', () => {
    expect(readouts().length).toBe(4);
    expect(readouts().map((readout) => text(readout, '.rpt-kpi-strip__label'))).toEqual([
      'Total revenue',
      'Open invoices',
      'Overdue',
      'Health',
    ]);
  });

  it('formats numeric values and passes strings through untouched', () => {
    const values = readouts().map((readout) => text(readout, '.rpt-kpi-strip__value'));
    expect(values).toEqual(['$1,284,902.44', '38', '12', 'nominal']);
  });

  it('renders positive deltas with an upward arrow and the up class', () => {
    const delta = readouts()[0].querySelector('.rpt-kpi-strip__delta');
    expect(delta?.classList).toContain('rpt-kpi-strip__delta--up');
    expect(delta?.querySelector('mat-icon')?.textContent?.trim()).toBe('arrow_upward');
    expect(delta?.textContent).toContain('+4.2');
  });

  it('renders negative deltas with a downward arrow and the down class', () => {
    const delta = readouts()[2].querySelector('.rpt-kpi-strip__delta');
    expect(delta?.classList).toContain('rpt-kpi-strip__delta--down');
    expect(delta?.querySelector('mat-icon')?.textContent?.trim()).toBe('arrow_downward');
    expect(delta?.textContent).toContain('-3');
  });

  it('hides the delta when omitted or null', () => {
    expect(readouts()[3].querySelector('.rpt-kpi-strip__delta')).toBeNull();

    host.items = [{ label: 'Overdue', value: 12, delta: null }];
    fixture.detectChanges();
    expect(readouts()[0].querySelector('.rpt-kpi-strip__delta')).toBeNull();
  });

  it('renders a sparkline polyline scaled into the viewBox', () => {
    host.items = [{ label: 'Revenue', value: 7400, sparkline: [0, 10, 5] }];
    fixture.detectChanges();

    const polyline = element().querySelector('.rpt-kpi-strip__sparkline polyline');
    expect(polyline?.getAttribute('points')).toBe('0,22 42,2 84,12');
  });

  it('labels the sparkline after the metric', () => {
    host.items = [{ label: 'Revenue', value: 7400, sparkline: [0, 10, 5] }];
    fixture.detectChanges();

    expect(
      element().querySelector('.rpt-kpi-strip__sparkline')?.getAttribute('aria-label'),
    ).toBe('Revenue trend');
  });

  it('hides the sparkline for missing or single-point series', () => {
    expect(element().querySelector('.rpt-kpi-strip__sparkline')).toBeNull();

    host.items = [{ label: 'Revenue', value: 7400, sparkline: [7] }];
    fixture.detectChanges();
    expect(element().querySelector('.rpt-kpi-strip__sparkline')).toBeNull();
  });

  it('draws a midline for a flat series', () => {
    host.items = [{ label: 'Revenue', value: 7400, sparkline: [5, 5] }];
    fixture.detectChanges();

    const polyline = element().querySelector('.rpt-kpi-strip__sparkline polyline');
    expect(polyline?.getAttribute('points')).toBe('0,12 84,12');
  });

  it('renders nothing for an empty items list', () => {
    host.items = [];
    fixture.detectChanges();
    expect(readouts().length).toBe(0);
  });
});
