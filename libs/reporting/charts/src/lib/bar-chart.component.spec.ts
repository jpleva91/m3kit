import { ApplicationRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChartComponent, BarChartMode, BarChartSeries } from './bar-chart.component';

/** Minimal ResizeObserver stand-in (jsdom has none) we can fire by hand. */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  observe(): void {
    // no-op: the test fires measurements via emit().
  }
  unobserve(): void {
    // no-op: the test fires measurements via emit().
  }
  disconnect(): void {
    // no-op: the test fires measurements via emit().
  }

  emit(width: number): void {
    this.callback(
      [{ contentRect: { width } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

@Component({
  imports: [BarChartComponent],
  template: `
    <rpt-bar-chart
      [categories]="categories"
      [series]="series"
      [mode]="mode"
      [horizontal]="horizontal"
      [height]="height"
      [ariaLabel]="ariaLabel"
    />
  `,
})
class HostComponent {
  categories: readonly string[] = [];
  series: readonly BarChartSeries[] = [];
  mode: BarChartMode = 'grouped';
  horizontal = false;
  height = 240;
  ariaLabel = 'Bar chart';
}

describe('BarChartComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const bars = (): readonly Element[] => [...element().querySelectorAll('.rpt-bar-chart__bar')];
  const rect = (el: Element): Record<string, string | null> => ({
    x: el.getAttribute('x'),
    y: el.getAttribute('y'),
    width: el.getAttribute('width'),
    height: el.getAttribute('height'),
  });
  const tickLabels = (selector: string): readonly string[] =>
    [...element().querySelectorAll(selector)].map((el) => el.textContent?.trim() ?? '');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an accessible empty SVG when there is no data', () => {
    const svg = element().querySelector('svg.rpt-bar-chart');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Bar chart');
    expect(bars()).toHaveLength(0);
  });

  it('places single-series bars on the zero baseline with exact geometry', () => {
    host.categories = ['Q1', 'Q2'];
    host.series = [{ name: 'Paid', values: [5, 10] }];
    fixture.detectChanges();

    // Plot 44..588 × 12..212; domain [0, 10] → 20 viewBox px per unit.
    expect(bars()).toHaveLength(2);
    expect(rect(bars()[0])).toEqual({ x: '84.8', y: '112', width: '190.4', height: '100' });
    expect(rect(bars()[1])).toEqual({ x: '356.8', y: '12', width: '190.4', height: '200' });
    expect(bars()[0].getAttribute('fill')).toBe('var(--app-chart-1)');
  });

  it('renders nice value ticks and centered category labels', () => {
    host.categories = ['Q1', 'Q2'];
    host.series = [{ name: 'Paid', values: [5, 10] }];
    fixture.detectChanges();

    expect(tickLabels('.rpt-bar-chart__tick--value')).toEqual(['0', '2', '4', '6', '8', '10']);
    expect(tickLabels('.rpt-bar-chart__tick--category')).toEqual(['Q1', 'Q2']);
    const categoryTicks = [...element().querySelectorAll('.rpt-bar-chart__tick--category')];
    expect(categoryTicks.map((el) => el.getAttribute('x'))).toEqual(['180', '452']);
    expect(element().querySelectorAll('.rpt-bar-chart__grid-line')).toHaveLength(6);
  });

  it('lays grouped series side by side within the category band', () => {
    host.categories = ['Q1'];
    host.series = [
      { name: 'Paid', values: [4] },
      { name: 'Overdue', values: [8] },
    ];
    fixture.detectChanges();

    // Domain [0, 8] → 25 viewBox px per unit; band 544, usable 380.8.
    expect(rect(bars()[0])).toEqual({ x: '125.6', y: '112', width: '190.4', height: '100' });
    expect(rect(bars()[1])).toEqual({ x: '316', y: '12', width: '190.4', height: '200' });
    expect(bars()[1].getAttribute('fill')).toBe('var(--app-chart-2)');
  });

  it('draws negative grouped values below the zero baseline', () => {
    host.categories = ['Q1'];
    host.series = [
      { name: 'Delta', values: [-5] },
      { name: 'Total', values: [10] },
    ];
    fixture.detectChanges();

    // Domain [-5, 10]; zero baseline at y = 145.33.
    expect(rect(bars()[0])).toEqual({ x: '125.6', y: '145.33', width: '190.4', height: '66.67' });
    expect(rect(bars()[1])).toEqual({ x: '316', y: '12', width: '190.4', height: '133.33' });
    expect(tickLabels('.rpt-bar-chart__tick--value')).toEqual(['-5', '0', '5', '10']);
  });

  it('stacks segments whose heights sum to the scaled category total', () => {
    host.categories = ['Q1', 'Q2'];
    host.series = [
      { name: 'Paid', values: [3, 5] },
      { name: 'Overdue', values: [7, 5] },
    ];
    host.mode = 'stacked';
    fixture.detectChanges();

    // Sums are 10 → domain [0, 10] → 20 viewBox px per unit.
    const q1 = bars().filter((bar) => bar.getAttribute('data-category') === '0');
    expect(rect(q1[0])).toEqual({ x: '84.8', y: '152', width: '190.4', height: '60' });
    expect(rect(q1[1])).toEqual({ x: '84.8', y: '12', width: '190.4', height: '140' });
    const total = q1.reduce((sum, bar) => sum + Number(bar.getAttribute('height')), 0);
    expect(total).toBe(200);
  });

  it('swaps axes in horizontal mode', () => {
    host.categories = ['Q1'];
    host.series = [{ name: 'Paid', values: [5] }];
    host.horizontal = true;
    fixture.detectChanges();

    // Values run 88..588 over domain [0, 5]; the band runs 12..212.
    expect(rect(bars()[0])).toEqual({ x: '88', y: '42', width: '500', height: '140' });
    const valueTicks = [...element().querySelectorAll('.rpt-bar-chart__tick--value')];
    expect(valueTicks.map((el) => el.getAttribute('x'))).toEqual([
      '88',
      '188',
      '288',
      '388',
      '488',
      '588',
    ]);
    const categoryTick = element().querySelector('.rpt-bar-chart__tick--category');
    expect(categoryTick?.getAttribute('y')).toBe('112');
  });

  it('adopts the measured host width as the viewBox width and rescales', () => {
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    try {
      const local = TestBed.createComponent(HostComponent);
      local.componentInstance.categories = ['Q1', 'Q2'];
      local.componentInstance.series = [{ name: 'Paid', values: [5, 10] }];
      local.detectChanges();
      TestBed.inject(ApplicationRef).tick(); // flush afterNextRender → observe()

      const observer = FakeResizeObserver.instances.at(-1);
      expect(observer).toBeDefined();
      observer?.emit(320);
      local.detectChanges();

      const root = local.nativeElement as HTMLElement;
      expect(root.querySelector('svg.rpt-bar-chart')?.getAttribute('viewBox')).toBe('0 0 320 240');
      // Plot 44..308 → band 132, inset 19.8, bar width 92.4; heights keep.
      const first = root.querySelector('.rpt-bar-chart__bar');
      expect(first?.getAttribute('x')).toBe('63.8');
      expect(first?.getAttribute('width')).toBe('92.4');
      expect(first?.getAttribute('y')).toBe('112');
      expect(first?.getAttribute('height')).toBe('100');
    } finally {
      globalThis.ResizeObserver = original;
      FakeResizeObserver.instances = [];
    }
  });

  it('clamps negative values to zero in stacked mode', () => {
    host.categories = ['Q1'];
    host.series = [
      { name: 'Paid', values: [-3] },
      { name: 'Overdue', values: [4] },
    ];
    host.mode = 'stacked';
    fixture.detectChanges();

    expect(rect(bars()[0]).height).toBe('0');
    expect(Number(rect(bars()[1]).height)).toBe(200);
  });
});
