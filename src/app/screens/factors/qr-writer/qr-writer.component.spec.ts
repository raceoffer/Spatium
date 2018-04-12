import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QrWriterComponent } from './qr-writer.component';

describe('QrWriterComponent', () => {
  let component: QrWriterComponent;
  let fixture: ComponentFixture<QrWriterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QrWriterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QrWriterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
