import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiCardComponent, KpiValueFormat } from './kpi-card.component';

@Component({
  imports: [KpiCardComponent],
  template: `
    <rpt-kpi-card
      [label]="label"
      [value]="value"
      [format]="format"
      [delta]="delta"
      [sparkline]="sparkline"
      [icon]="icon"
    />
  `,
})
class HostComponent {
  label = 'Total revenue';
  value: string | number = 384200;
  format: KpiValueFormat | null = null;
  delta: number | null = null;
  sparkline: readonly number[] | null = null;
  icon: string | null = null;
}

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (selector: string): string | undefined =>
    element().querySelector(selector)?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label and the raw value by default', () => {
    expect(text('.rpt-kpi-card__label')).toBe('Total revenue');
    expect(text('.rpt-kpi-card__value')).toBe('384200');
  });

  it('formats numeric values as number, currency, and percent', () => {
    host.format = 'number';
    fixture.detectChanges();
    expect(text('.rpt-kpi-card__value')).toBe('384,200');

    host.format = 'currency';
    fixture.detectChanges();
    expect(text('.rpt-kpi-card__value')).toBe('$384,200.00');

    host.value = 0.42;
    host.format = 'percent';
    fixture.detectChanges();
    expect(text('.rpt-kpi-card__value')).toBe('42%');
  });

  it('leaves string values untouched regardless of format', () => {
    host.value = 'n/a';
    host.format = 'currency';
    fixture.detectChanges();
    expect(text('.rpt-kpi-card__value')).toBe('n/a');
  });

  it('hides the delta when null', () => {
    expect(element().querySelector('.rpt-kpi-card__delta')).toBeNull();
  });

  it('renders a positive delta with an upward arrow and success class', () => {
    host.delta = 12;
    fixture.detectChanges();

    const delta = element().querySelector('.rpt-kpi-card__delta');
    expect(delta?.classList).toContain('rpt-kpi-card__delta--up');
    expect(delta?.querySelector('mat-icon')?.textContent?.trim()).toBe('arrow_upward');
    expect(delta?.textContent).toContain('+12');
  });

  it('renders a negative delta with a downward arrow and warn class', () => {
    host.delta = -3;
    fixture.detectChanges();

    const delta = element().querySelector('.rpt-kpi-card__delta');
    expect(delta?.classList).toContain('rpt-kpi-card__delta--down');
    expect(delta?.querySelector('mat-icon')?.textContent?.trim()).toBe('arrow_downward');
    expect(delta?.textContent).toContain('-3');
  });

  it('renders a sparkline polyline scaled into the viewBox', () => {
    host.sparkline = [0, 10, 5];
    fixture.detectChanges();

    const polyline = element().querySelector('.rpt-kpi-card__sparkline polyline');
    expect(polyline?.getAttribute('points')).toBe('0,30 50,2 100,16');
  });

  it('hides the sparkline for missing or single-point series', () => {
    expect(element().querySelector('.rpt-kpi-card__sparkline')).toBeNull();

    host.sparkline = [7];
    fixture.detectChanges();
    expect(element().querySelector('.rpt-kpi-card__sparkline')).toBeNull();
  });

  it('draws a midline for a flat series', () => {
    host.sparkline = [5, 5];
    fixture.detectChanges();

    const polyline = element().querySelector('.rpt-kpi-card__sparkline polyline');
    expect(polyline?.getAttribute('points')).toBe('0,16 100,16');
  });

  it('renders the optional icon', () => {
    expect(element().querySelector('.rpt-kpi-card__icon')).toBeNull();

    host.icon = 'payments';
    fixture.detectChanges();
    expect(text('.rpt-kpi-card__icon')).toBe('payments');
  });
});
