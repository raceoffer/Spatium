import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteSeedComponent } from './delete-seed.component';

describe('DeleteSeedComponent', () => {
  let component: DeleteSeedComponent;
  let fixture: ComponentFixture<DeleteSeedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteSeedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteSeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
