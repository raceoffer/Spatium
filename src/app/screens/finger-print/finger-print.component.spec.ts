import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FingerPrintComponent } from './finger-print.component';

describe('FingerPrintComponent', () => {
  let component: FingerPrintComponent;
  let fixture: ComponentFixture<FingerPrintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FingerPrintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FingerPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
