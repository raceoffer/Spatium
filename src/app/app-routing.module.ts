import { NgModule } from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {WalletComponent} from './screens/wallet/wallet.component';
import {ExchangeComponent} from './screens/exchange/exchange.component';
import {IcoComponent} from './screens/ico/ico.component';
import {PortfolioInvestmentComponent} from './screens/portfolio-investment/portfolio-investment.component';
import {VerificationComponent} from './screens/verification/verification.component';
import {OptionsComponent} from './screens/options/options.component';
import {EntryComponent} from './screens/entry/entry.component';
import {NavigatorComponent} from './screens/navigator/navigator.component';
import {StartComponent} from './screens/start/start.component';
import {ConnectComponent} from "./screens/connect/connect.component";
import {RegistrationComponent} from "./screens/registration/registration.component";


const appRoutes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  { path: 'start', component: StartComponent },
  { path: 'entry', component: EntryComponent },
  { path: 'connect', component: ConnectComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'navigator', component: NavigatorComponent, children: [
    { path: 'wallet', component: WalletComponent, outlet: 'navigator' },
    { path: 'exchange', component: ExchangeComponent, outlet: 'navigator' },
    { path: 'ico', component: IcoComponent, outlet: 'navigator' },
    { path: 'portfolio_investment', component: PortfolioInvestmentComponent, outlet: 'navigator' },
    { path: 'verification', component: VerificationComponent, outlet: 'navigator' },
    { path: 'options', component: OptionsComponent, outlet: 'navigator' }
  ]},
];
@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
