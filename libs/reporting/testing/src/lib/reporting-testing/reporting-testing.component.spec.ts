import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportingTestingComponent } from './reporting-testing.component';

describe('ReportingTestingComponent', () => {
  let component: ReportingTestingComponent;
  let fixture: ComponentFixture<ReportingTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportingTestingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportingTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
