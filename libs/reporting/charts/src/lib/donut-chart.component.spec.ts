import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonutChartComponent, DonutChartSlice } from './donut-chart.component';

@Component({
  imports: [DonutChartComponent],
  template: `
    <rpt-donut-chart
      [slices]="slices"
      [centerLabel]="centerLabel"
      [centerValue]="centerValue"
      [height]="height"
      [ariaLabel]="ariaLabel"
    />
  `,
})
class HostComponent {
  slices: readonly DonutChartSlice[] = [];
  centerLabel: string | null = null;
  centerValue: string | null = null;
  height = 240;
  ariaLabel = 'Donut chart';
}

describe('DonutChartComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const slices = (): readonly Element[] =>
    [...element().querySelectorAll('.rpt-donut-chart__slice')];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an accessible empty SVG when there is no data', () => {
    const svg = element().querySelector('svg.rpt-donut-chart');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Donut chart');
    expect(slices()).toHaveLength(0);
  });

  it('converts values into exact percentage dash geometry', () => {
    host.slices = [
      { label: 'Paid', value: 1 },
      { label: 'Sent', value: 1 },
      { label: 'Overdue', value: 2 },
    ];
    fixture.detectChanges();

    const arcs = slices();
    expect(arcs).toHaveLength(3);
    // pathLength=100 makes dash values literal percentages.
    expect(arcs[0].getAttribute('pathLength')).toBe('100');
    expect(arcs[0].getAttribute('stroke-dasharray')).toBe('25 75');
    expect(arcs[0].getAttribute('stroke-dashoffset')).toBe('0');
    expect(arcs[1].getAttribute('stroke-dasharray')).toBe('25 75');
    expect(arcs[1].getAttribute('stroke-dashoffset')).toBe('-25');
    expect(arcs[2].getAttribute('stroke-dasharray')).toBe('50 50');
    expect(arcs[2].getAttribute('stroke-dashoffset')).toBe('-50');
  });

  it('cycles slice colors and honors explicit color tokens', () => {
    host.slices = [
      { label: 'A', value: 1 },
      { label: 'B', value: 1 },
      { label: 'C', value: 1, colorToken: 6 },
    ];
    fixture.detectChanges();

    const strokes = slices().map((arc) => arc.getAttribute('stroke'));
    expect(strokes).toEqual(['var(--app-chart-1)', 'var(--app-chart-2)', 'var(--app-chart-6)']);
  });

  it('drops zero-value slices without shifting the colors of the rest', () => {
    host.slices = [
      { label: 'A', value: 3 },
      { label: 'B', value: 0 },
      { label: 'C', value: 1 },
    ];
    fixture.detectChanges();

    const arcs = slices();
    expect(arcs).toHaveLength(2);
    expect(arcs[0].getAttribute('data-slice')).toBe('A');
    expect(arcs[1].getAttribute('data-slice')).toBe('C');
    // C keeps its original third-token color despite B being dropped.
    expect(arcs[1].getAttribute('stroke')).toBe('var(--app-chart-3)');
    expect(arcs[1].getAttribute('stroke-dashoffset')).toBe('-75');
  });

  it('renders the center value and label when provided', () => {
    host.slices = [{ label: 'Paid', value: 1 }];
    host.centerValue = '110';
    host.centerLabel = 'Invoices';
    fixture.detectChanges();

    expect(element().querySelector('.rpt-donut-chart__center-value')?.textContent?.trim()).toBe(
      '110',
    );
    expect(element().querySelector('.rpt-donut-chart__center-label')?.textContent?.trim()).toBe(
      'Invoices',
    );
  });

  it('hides center text by default', () => {
    host.slices = [{ label: 'Paid', value: 1 }];
    fixture.detectChanges();

    expect(element().querySelector('.rpt-donut-chart__center-value')).toBeNull();
    expect(element().querySelector('.rpt-donut-chart__center-label')).toBeNull();
  });

  it('keeps the circle undistorted (no preserveAspectRatio override)', () => {
    host.slices = [{ label: 'Paid', value: 1 }];
    host.height = 180;
    fixture.detectChanges();

    const svg = element().querySelector('svg.rpt-donut-chart');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 200 200');
    expect(svg?.getAttribute('preserveAspectRatio')).toBeNull();
    expect((svg as SVGSVGElement).style.height).toBe('180px');
  });
});
