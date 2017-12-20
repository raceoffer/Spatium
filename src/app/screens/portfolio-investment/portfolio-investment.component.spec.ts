import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioInvestmentComponent } from './portfolio-investment.component';

describe('PortfolioInvestmentComponent', () => {
  let component: PortfolioInvestmentComponent;
  let fixture: ComponentFixture<PortfolioInvestmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PortfolioInvestmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortfolioInvestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
