import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretDeleteComponent } from './secret-delete.component';

describe('SecretDeleteComponent', () => {
  let component: SecretDeleteComponent;
  let fixture: ComponentFixture<SecretDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecretDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecretDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
