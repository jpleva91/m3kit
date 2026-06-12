import { ApplicationRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineChartComponent, LineChartSeries } from './line-chart.component';

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
  imports: [LineChartComponent],
  template: `
    <m3k-line-chart
      [series]="series"
      [area]="area"
      [showAxes]="showAxes"
      [showGrid]="showGrid"
      [height]="height"
      [ariaLabel]="ariaLabel"
    />
  `,
})
class HostComponent {
  series: readonly LineChartSeries[] = [];
  area = false;
  showAxes = true;
  showGrid = true;
  height = 240;
  ariaLabel = 'Line chart';
}

describe('LineChartComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const lines = (): readonly Element[] => [...element().querySelectorAll('.m3k-line-chart__line')];
  const tickLabels = (selector: string): readonly string[] =>
    [...element().querySelectorAll(selector)].map((el) => el.textContent?.trim() ?? '');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an accessible empty SVG when there is no data', () => {
    const svg = element().querySelector('svg.m3k-line-chart');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Line chart');
    expect(lines()).toHaveLength(0);
  });

  it('scales a bare (axis-free) chart into the slim-padded plot exactly', () => {
    host.series = [
      {
        name: 'Revenue',
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 10 },
        ],
      },
    ];
    host.showAxes = false;
    host.showGrid = false;
    host.height = 104;
    fixture.detectChanges();

    // Margins 4; y domain [0, 10] from nice ticks; x domain [0, 1].
    expect(lines()[0].getAttribute('d')).toBe('M4,100 L596,4');
    expect(element().querySelector('.m3k-line-chart__grid-line')).toBeNull();
    expect(element().querySelector('.m3k-line-chart__axis')).toBeNull();
  });

  it('closes the area path down to the domain baseline', () => {
    host.series = [
      {
        name: 'Revenue',
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 10 },
        ],
      },
    ];
    host.area = true;
    host.showAxes = false;
    host.showGrid = false;
    host.height = 104;
    fixture.detectChanges();

    const area = element().querySelector('.m3k-line-chart__area');
    expect(area?.getAttribute('d')).toBe('M4,100 L596,4 L596,100 L4,100 Z');
    expect(area?.getAttribute('fill')).toBe(
      'color-mix(in srgb, var(--app-chart-1) 20%, transparent)',
    );
  });

  it('renders no area fill by default', () => {
    host.series = [{ name: 'Revenue', points: [{ x: 0, y: 1 }] }];
    fixture.detectChanges();
    expect(element().querySelector('.m3k-line-chart__area')).toBeNull();
  });

  it('marks a single-point series with a token-colored circle', () => {
    host.series = [{ name: 'Lone', points: [{ x: 0, y: 5 }] }];
    host.showAxes = false;
    host.showGrid = false;
    host.height = 104;
    fixture.detectChanges();

    // Zero-span x domain maps to the plot midpoint (4 + 596) / 2 = 300;
    // y domain [0, 5] puts the value at the top of the plot.
    const point = element().querySelector('.m3k-line-chart__point');
    expect(point?.getAttribute('cx')).toBe('300');
    expect(point?.getAttribute('cy')).toBe('4');
    expect(point?.getAttribute('r')).toBe('3');
    expect(point?.getAttribute('fill')).toBe('var(--app-chart-1)');
  });

  it('renders no point marker for multi-point series', () => {
    host.series = [
      {
        name: 'Revenue',
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 10 },
        ],
      },
    ];
    fixture.detectChanges();

    expect(element().querySelector('.m3k-line-chart__point')).toBeNull();
  });

  it('renders nice y ticks, grid lines, and category x labels', () => {
    host.series = [
      {
        name: 'Revenue',
        points: [
          { x: 'Jan', y: 0 },
          { x: 'Feb', y: 5 },
          { x: 'Mar', y: 10 },
        ],
      },
    ];
    fixture.detectChanges();

    expect(tickLabels('.m3k-line-chart__tick--y')).toEqual(['0', '2', '4', '6', '8', '10']);
    expect(tickLabels('.m3k-line-chart__tick--x')).toEqual(['Jan', 'Feb', 'Mar']);
    expect(element().querySelectorAll('.m3k-line-chart__grid-line')).toHaveLength(6);

    // Plot box: left 44, right 588, top 12, bottom 212 (height 240).
    expect(lines()[0].getAttribute('d')).toBe('M44,212 L316,112 L588,12');
    const yTickEls = [...element().querySelectorAll('.m3k-line-chart__tick--y')];
    expect(yTickEls.map((el) => el.getAttribute('y'))).toEqual([
      '212',
      '172',
      '132',
      '92',
      '52',
      '12',
    ]);
  });

  it('labels only the first, last, and a few interior points of a long series', () => {
    host.series = [
      {
        name: 'Daily',
        points: Array.from({ length: 12 }, (_, i) => ({ x: `D${i}`, y: i })),
      },
    ];
    fixture.detectChanges();

    expect(tickLabels('.m3k-line-chart__tick--x')).toEqual(['D0', 'D3', 'D6', 'D8', 'D11']);
  });

  it('cycles series colors through the six chart tokens', () => {
    host.series = Array.from({ length: 7 }, (_, i) => ({
      name: `S${i}`,
      points: [
        { x: 0, y: 0 },
        { x: 1, y: i + 1 },
      ],
    }));
    fixture.detectChanges();

    const strokes = lines().map((line) => line.getAttribute('stroke'));
    expect(strokes[0]).toBe('var(--app-chart-1)');
    expect(strokes[5]).toBe('var(--app-chart-6)');
    expect(strokes[6]).toBe('var(--app-chart-1)');
  });

  it('skips empty series without breaking the color cycle of the rest', () => {
    host.series = [
      { name: 'Empty', points: [] },
      {
        name: 'Real',
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      },
    ];
    fixture.detectChanges();

    expect(lines()).toHaveLength(1);
    expect(lines()[0].getAttribute('stroke')).toBe('var(--app-chart-1)');
  });

  it('stretches via viewBox with preserveAspectRatio none', () => {
    host.series = [{ name: 'Revenue', points: [{ x: 0, y: 1 }] }];
    host.height = 180;
    fixture.detectChanges();

    const svg = element().querySelector('svg.m3k-line-chart');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 600 180');
    expect(svg?.getAttribute('preserveAspectRatio')).toBe('none');
    expect((svg as SVGSVGElement).style.height).toBe('180px');
  });

  it('adopts the measured host width as the viewBox width and rescales', () => {
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    try {
      const local = TestBed.createComponent(HostComponent);
      local.componentInstance.series = [
        {
          name: 'Revenue',
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 10 },
          ],
        },
      ];
      local.componentInstance.showAxes = false;
      local.componentInstance.showGrid = false;
      local.componentInstance.height = 104;
      local.detectChanges();
      TestBed.inject(ApplicationRef).tick(); // flush afterNextRender → observe()

      const observer = FakeResizeObserver.instances.at(-1);
      expect(observer).toBeDefined();
      observer?.emit(320);
      local.detectChanges();

      const root = local.nativeElement as HTMLElement;
      expect(root.querySelector('svg.m3k-line-chart')?.getAttribute('viewBox')).toBe(
        '0 0 320 104',
      );
      // Margins 4 → the line now ends at x = 320 - 4 = 316.
      expect(root.querySelector('.m3k-line-chart__line')?.getAttribute('d')).toBe(
        'M4,100 L316,4',
      );
    } finally {
      globalThis.ResizeObserver = original;
      FakeResizeObserver.instances = [];
    }
  });
});
