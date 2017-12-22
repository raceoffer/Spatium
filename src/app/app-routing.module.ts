import { NgModule } from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {WalletComponent} from './screens/wallet/wallet.component';
import {NavigatorComponent} from './screens/navigator/navigator.component';
import {StartComponent} from './screens/start/start.component';
import {WaitingComponent} from './screens/waiting/waiting.component';
import {ConnectComponent} from './screens/connect/connect.component';



const appRoutes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  { path: 'start', component: StartComponent },
  { path: 'waiting', component: WaitingComponent },
  { path: 'connect', component: ConnectComponent },
  { path: 'navigator', component: NavigatorComponent, children: [
    { path: 'wallet', component: WalletComponent, outlet: 'navigator' },
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
