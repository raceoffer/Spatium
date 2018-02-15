import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainDrawerComponent } from './main-drawer.component';

describe('MainDrawerComponent', () => {
  let component: MainDrawerComponent;
  let fixture: ComponentFixture<MainDrawerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainDrawerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
