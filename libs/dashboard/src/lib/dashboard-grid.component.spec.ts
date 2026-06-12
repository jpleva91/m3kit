import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardGridComponent, DashboardGridSpan, GridSpanDirective } from './dashboard-grid.component';

@Component({
  imports: [DashboardGridComponent, GridSpanDirective],
  template: `
    <m3k-dashboard-grid [minColumnWidth]="minColumnWidth" [gap]="gap">
      <div class="cell">A</div>
      <div class="cell" [m3kGridSpan]="span">B</div>
    </m3k-dashboard-grid>
  `,
})
class HostComponent {
  minColumnWidth = '16rem';
  gap = '1rem';
  span: DashboardGridSpan = 2;
}

describe('DashboardGridComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const grid = (): HTMLElement =>
    element().querySelector('m3k-dashboard-grid') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects its children', () => {
    const cells = element().querySelectorAll('.cell');
    expect(cells.length).toBe(2);
    expect(cells[0].textContent).toBe('A');
  });

  it('exposes the minimum column width as a CSS variable and applies the gap', () => {
    expect(grid().style.getPropertyValue('--m3k-dashboard-grid-min-column-width')).toBe('16rem');
    expect(grid().style.gap).toBe('1rem');

    host.minColumnWidth = '12rem';
    host.gap = '2rem';
    fixture.detectChanges();

    expect(grid().style.getPropertyValue('--m3k-dashboard-grid-min-column-width')).toBe('12rem');
    expect(grid().style.gap).toBe('2rem');
  });

  it('spans a child across columns via m3kGridSpan', () => {
    const spanned = element().querySelectorAll<HTMLElement>('.cell')[1];
    expect(spanned.style.gridColumn).toBe('span 2');
  });

  it('stretches a child across the full row with m3kGridSpan="full"', () => {
    host.span = 'full';
    fixture.detectChanges();

    const spanned = element().querySelectorAll<HTMLElement>('.cell')[1];
    expect(spanned.style.gridColumn).toBe('1 / -1');
  });
});
