import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FactorNodeComponent } from './factor-node.component';

describe('FactorNodeComponent', () => {
  let component: FactorNodeComponent;
  let fixture: ComponentFixture<FactorNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FactorNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FactorNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
