import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretExportComponent } from './secret-export.component';

describe('SecretExportComponent', () => {
  let component: SecretExportComponent;
  let fixture: ComponentFixture<SecretExportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecretExportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecretExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
