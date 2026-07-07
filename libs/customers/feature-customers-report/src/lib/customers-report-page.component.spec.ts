import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CustomersReportPageComponent } from './customers-report-page.component';

describe('CustomersReportPageComponent', () => {
  it('renders the side-by-side port shell', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersReportPageComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(CustomersReportPageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('m3k-page-header')).not.toBeNull();
  });
});
