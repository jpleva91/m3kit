import { TestBed } from '@angular/core/testing';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
    }).compileComponents();
  });

  it('should render the placeholder heading', () => {
    const fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Reports');
  });
});
