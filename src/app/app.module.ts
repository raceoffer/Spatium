import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatToolbarModule,
} from '@angular/material';
import {OverlayContainer} from '@angular/cdk/overlay';
import {FlexLayoutModule} from '@angular/flex-layout';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import { WalletComponent } from './screens/wallet/wallet.component';
import { ExchangeComponent } from './screens/exchange/exchange.component';
import { IcoComponent } from './screens/ico/ico.component';
import { PortfolioInvestmentComponent } from './screens/portfolio-investment/portfolio-investment.component';
import { VerificationComponent } from './screens/verification/verification.component';
import { OptionsComponent } from './screens/options/options.component';
import { EntryComponent } from './screens/entry/entry.component';


@NgModule({
  declarations: [
    AppComponent,
    WalletComponent,
    ExchangeComponent,
    IcoComponent,
    PortfolioInvestmentComponent,
    VerificationComponent,
    OptionsComponent,
    EntryComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    NoopAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    FlexLayoutModule,
    MatSlideToggleModule,
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
  constructor(overlayContainer: OverlayContainer) {
    overlayContainer.getContainerElement().classList.add('dark-theme');
  }
}
