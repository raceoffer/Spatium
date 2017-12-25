import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatingResultComponent } from './creating-result.component';

describe('CreatingResultComponent', () => {
  let component: CreatingResultComponent;
  let fixture: ComponentFixture<CreatingResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatingResultComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatingResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
