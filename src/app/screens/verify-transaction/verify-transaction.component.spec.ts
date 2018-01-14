import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyTransactionComponent } from './verify-transaction.component';

describe('VerifyTransactionComponent', () => {
  let component: VerifyTransactionComponent;
  let fixture: ComponentFixture<VerifyTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VerifyTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
