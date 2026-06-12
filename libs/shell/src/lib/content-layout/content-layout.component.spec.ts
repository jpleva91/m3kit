import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ContentLayoutComponent,
  ContentLayoutMode,
} from './content-layout.component';

@Component({
  imports: [ContentLayoutComponent],
  template: `
    <m3k-content-layout [mode]="mode">
      <section class="probe-primary">Invoice table</section>
      <aside m3kContentAside class="probe-aside">Filters</aside>
    </m3k-content-layout>
  `,
})
class HostComponent {
  mode: ContentLayoutMode = 'full';
}

describe('ContentLayoutComponent', () => {
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

  it('renders the full mode by default with the projected content', () => {
    const wrapper = element().querySelector('.m3k-content-layout');
    expect(wrapper?.classList).toContain('m3k-content-layout--full');
    expect(wrapper?.querySelector('.probe-primary')?.textContent).toContain(
      'Invoice table',
    );
  });

  it('renders the centered mode wrapper', () => {
    host.mode = 'centered';
    fixture.detectChanges();

    const wrapper = element().querySelector('.m3k-content-layout');
    expect(wrapper?.classList).toContain('m3k-content-layout--centered');
    expect(wrapper?.querySelector('.probe-primary')).toBeTruthy();
  });

  it('renders split mode with primary and aside regions', () => {
    host.mode = 'split';
    fixture.detectChanges();

    const wrapper = element().querySelector('.m3k-content-layout');
    expect(wrapper?.classList).toContain('m3k-content-layout--split');
    expect(
      wrapper?.querySelector('.m3k-content-layout__primary .probe-primary'),
    ).toBeTruthy();
    expect(
      wrapper?.querySelector('.m3k-content-layout__aside .probe-aside'),
    ).toBeTruthy();
  });

  it('switches modes at runtime without losing projected content', () => {
    for (const mode of ['split', 'centered', 'full'] as const) {
      host.mode = mode;
      fixture.detectChanges();
      expect(
        element().querySelector(`.m3k-content-layout--${mode} .probe-primary`),
      ).toBeTruthy();
    }
  });
});
