import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencySettingsComponent } from './currency-settings.component';

describe('CurrencySettingsComponent', () => {
  let component: CurrencySettingsComponent;
  let fixture: ComponentFixture<CurrencySettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrencySettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
