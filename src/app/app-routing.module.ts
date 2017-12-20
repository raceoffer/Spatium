import { NgModule } from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {WalletComponent} from './screens/wallet/wallet.component';
import {ExchangeComponent} from './screens/exchange/exchange.component';
import {IcoComponent} from './screens/ico/ico.component';
import {PortfolioInvestmentComponent} from './screens/portfolio-investment/portfolio-investment.component';
import {VerificationComponent} from './screens/verification/verification.component';
import {OptionsComponent} from './screens/options/options.component';
import {EntryComponent} from './screens/entry/entry.component';


const appRoutes: Routes = [
  { path: '', redirectTo: 'entry', pathMatch: 'full' },
  { path: 'entry', component: EntryComponent },
  { path: 'wallet', component: WalletComponent },
  { path: 'exchange', component: ExchangeComponent },
  { path: 'ico', component: IcoComponent },
  { path: 'portfolio_investment', component: PortfolioInvestmentComponent },
  { path: 'verification', component: VerificationComponent },
  { path: 'options', component: OptionsComponent }

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
