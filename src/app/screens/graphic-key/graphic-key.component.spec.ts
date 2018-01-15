import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicKeyComponent } from './graphic-key.component';

describe('GraphicKeyComponent', () => {
  let component: GraphicKeyComponent;
  let fixture: ComponentFixture<GraphicKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
