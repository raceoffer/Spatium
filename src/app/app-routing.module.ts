import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { StartComponent } from './screens/start/start.component';
import { InitiatorAuthComponent } from './screens/initiator-auth/initiator-auth.component';
import { VerifierAuthComponent } from './screens/verifier-auth/verifier-auth.component';
import { WaitingComponent } from './screens/waiting/waiting.component';
import { ConnectComponent } from './screens/connect/connect.component';
import { BackupComponent } from './screens/backup/backup.component';
import { SendTransactionComponent } from './screens/send-transaction/send-transaction.component';
import {VerifyTransactionComponent} from './screens/verify-transaction/verify-transaction.component';
import {PincodeComponent} from "./screens/pincode/pincode.component";
import {LoginComponent} from "./screens/login/login.component";
import {AuthComponent} from "./screens/auth/auth.component";
import {PasswordComponent} from "./screens/password/password.component";

const appRoutes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  { path: 'verifyTransaction', component: VerifyTransactionComponent },
  { path: 'start', component: StartComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'initiator-auth', component: InitiatorAuthComponent },
  { path: 'verifier-auth', component: VerifierAuthComponent  },
  { path: 'pincode', component: PincodeComponent },
  { path: 'password', component: PasswordComponent },
  { path: 'login', component: LoginComponent },
  { path: 'backup', component: BackupComponent},
  { path: 'waiting', component: WaitingComponent },
  { path: 'connect', component: ConnectComponent },
  { path: 'navigator', component: NavigatorComponent, children: [
    { path: 'wallet', component: SendTransactionComponent, outlet: 'navigator' },
  ]}
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
