import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ContentLayoutComponent,
  ContentLayoutMode,
} from './content-layout.component';

@Component({
  imports: [ContentLayoutComponent],
  template: `
    <rpt-content-layout [mode]="mode">
      <section class="probe-primary">Invoice table</section>
      <aside rptContentAside class="probe-aside">Filters</aside>
    </rpt-content-layout>
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
    const wrapper = element().querySelector('.rpt-content-layout');
    expect(wrapper?.classList).toContain('rpt-content-layout--full');
    expect(wrapper?.querySelector('.probe-primary')?.textContent).toContain(
      'Invoice table',
    );
  });

  it('renders the centered mode wrapper', () => {
    host.mode = 'centered';
    fixture.detectChanges();

    const wrapper = element().querySelector('.rpt-content-layout');
    expect(wrapper?.classList).toContain('rpt-content-layout--centered');
    expect(wrapper?.querySelector('.probe-primary')).toBeTruthy();
  });

  it('renders split mode with primary and aside regions', () => {
    host.mode = 'split';
    fixture.detectChanges();

    const wrapper = element().querySelector('.rpt-content-layout');
    expect(wrapper?.classList).toContain('rpt-content-layout--split');
    expect(
      wrapper?.querySelector('.rpt-content-layout__primary .probe-primary'),
    ).toBeTruthy();
    expect(
      wrapper?.querySelector('.rpt-content-layout__aside .probe-aside'),
    ).toBeTruthy();
  });

  it('switches modes at runtime without losing projected content', () => {
    for (const mode of ['split', 'centered', 'full'] as const) {
      host.mode = mode;
      fixture.detectChanges();
      expect(
        element().querySelector(`.rpt-content-layout--${mode} .probe-primary`),
      ).toBeTruthy();
    }
  });
});
