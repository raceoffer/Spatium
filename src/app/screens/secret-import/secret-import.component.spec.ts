import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretImportComponent } from './secret-import.component';

describe('SecretImportComponent', () => {
  let component: SecretImportComponent;
  let fixture: ComponentFixture<SecretImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecretImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecretImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
