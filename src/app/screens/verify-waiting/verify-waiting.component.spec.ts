import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyWaitingComponent } from './verify-waiting.component';

describe('VerifyWaitingComponent', () => {
  let component: VerifyWaitingComponent;
  let fixture: ComponentFixture<VerifyWaitingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VerifyWaitingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyWaitingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
