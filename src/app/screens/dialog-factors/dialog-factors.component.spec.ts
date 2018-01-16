import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogFactorsComponent } from './dialog-factors.component';

describe('DialogFactorsComponent', () => {
  let component: DialogFactorsComponent;
  let fixture: ComponentFixture<DialogFactorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogFactorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogFactorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
