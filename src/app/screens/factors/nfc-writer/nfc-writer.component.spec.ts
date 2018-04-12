import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NfcWriterComponent } from './nfc-writer.component';

describe('NfcWriterComponent', () => {
  let component: NfcWriterComponent;
  let fixture: ComponentFixture<NfcWriterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NfcWriterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NfcWriterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
