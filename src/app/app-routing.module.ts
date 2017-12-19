import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {BluetoothScreenComponent} from './screens/bluetooth/bluetooth.component';
import {ConnectScreenComponent} from './screens/connect/connect.component';
import {WalletScreenComponent} from './screens/wallet/wallet.component';

const appRoutes: Routes = [
    {path: '', redirectTo: 'wallet', pathMatch: 'full'},
    {path: 'bluetooth', component: BluetoothScreenComponent},
    {path: 'connect', component: ConnectScreenComponent},
    {path: 'wallet', component: WalletScreenComponent}
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
