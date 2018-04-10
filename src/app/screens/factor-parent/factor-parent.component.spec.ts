import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FactorParentComponent } from './factor-parent.component';

describe('FactorParentComponent', () => {
  let component: FactorParentComponent;
  let fixture: ComponentFixture<FactorParentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FactorParentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FactorParentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
