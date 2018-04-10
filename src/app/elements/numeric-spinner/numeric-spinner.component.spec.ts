import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumericSpinnerComponent } from './numeric-spinner.component';

describe('NumericSpinnerComponent', () => {
  let component: NumericSpinnerComponent;
  let fixture: ComponentFixture<NumericSpinnerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NumericSpinnerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumericSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
