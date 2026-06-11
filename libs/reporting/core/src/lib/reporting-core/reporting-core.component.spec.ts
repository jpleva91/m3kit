import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportingCoreComponent } from './reporting-core.component';

describe('ReportingCoreComponent', () => {
  let component: ReportingCoreComponent;
  let fixture: ComponentFixture<ReportingCoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportingCoreComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportingCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
