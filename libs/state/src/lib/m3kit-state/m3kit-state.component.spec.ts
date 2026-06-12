import { ComponentFixture, TestBed } from '@angular/core/testing';
import { M3kitStateComponent } from './m3kit-state.component';

describe('M3kitStateComponent', () => {
  let component: M3kitStateComponent;
  let fixture: ComponentFixture<M3kitStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3kitStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3kitStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
