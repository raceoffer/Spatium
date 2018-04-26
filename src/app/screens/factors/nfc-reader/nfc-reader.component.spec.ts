import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NfcReaderComponent } from './nfc-reader.component';

describe('NfcReaderComponent', () => {
  let component: NfcReaderComponent;
  let fixture: ComponentFixture<NfcReaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NfcReaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NfcReaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
