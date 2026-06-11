import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartLegendComponent, ChartLegendItem } from './chart-legend.component';

@Component({
  imports: [ChartLegendComponent],
  template: `<rpt-chart-legend [items]="items" />`,
})
class HostComponent {
  items: readonly ChartLegendItem[] = [];
}

describe('ChartLegendComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an empty list for no items', () => {
    expect(element().querySelectorAll('.rpt-chart-legend__item')).toHaveLength(0);
  });

  it('renders one swatch-and-label row per item', () => {
    host.items = [
      { label: 'Paid', colorIndex: 0 },
      { label: 'Overdue', colorIndex: 1 },
    ];
    fixture.detectChanges();

    const labels = [...element().querySelectorAll('.rpt-chart-legend__label')].map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toEqual(['Paid', 'Overdue']);

    const swatches = [
      ...element().querySelectorAll<HTMLElement>('.rpt-chart-legend__swatch'),
    ];
    expect(swatches[0].style.background).toBe('var(--app-chart-1)');
    expect(swatches[1].style.background).toBe('var(--app-chart-2)');
    expect(swatches[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('cycles color indices past the sixth token', () => {
    host.items = [{ label: 'Seventh', colorIndex: 6 }];
    fixture.detectChanges();

    const swatch = element().querySelector<HTMLElement>('.rpt-chart-legend__swatch');
    expect(swatch?.style.background).toBe('var(--app-chart-1)');
  });
});
