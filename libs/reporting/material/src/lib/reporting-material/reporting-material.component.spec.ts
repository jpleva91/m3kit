import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportingMaterialComponent } from './reporting-material.component';

describe('ReportingMaterialComponent', () => {
  let component: ReportingMaterialComponent;
  let fixture: ComponentFixture<ReportingMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportingMaterialComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportingMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
