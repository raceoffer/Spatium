import { NgModule }              from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {BluetoothScreen} from './screens/bluetooth/bluetooth.component';
import {ConnectScreen} from './screens/connect/connect.component';
import {WalletScreen} from './screens/wallet/wallet.component';

const appRoutes: Routes = [
  { path: '', redirectTo: 'bluetooth', pathMatch: 'full' },
  { path: 'bluetooth', component: BluetoothScreen },
  { path: 'connect', component: ConnectScreen },
  { path: 'wallet', component: WalletScreen }
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