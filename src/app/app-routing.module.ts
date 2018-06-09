import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './screens/auth/auth.component';
import { LoginComponent } from './screens/login/login.component';
import { DeleteSecretComponent } from './screens/navigator-verifier/delete-secret/delete-secret.component';
import { MainComponent } from './screens/navigator-verifier/main/main.component';
import { NavigatorVerifierComponent } from './screens/navigator-verifier/navigator-verifier.component';
import { SecretExportComponent } from './screens/navigator-verifier/secret-export/secret-export.component';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { WalletComponent } from './screens/navigator/wallet/wallet.component';
import { RegistrationComponent } from './screens/registration/registration.component';
import { StartComponent } from './screens/start/start.component';
import { VerifierCrateComponent } from "./screens/verifier-crate/verifier-crate.component";

const appRoutes: Routes = [{
  path: '',
  redirectTo: 'start',
  pathMatch: 'full'
}, {
  path: 'start',
  component: StartComponent
}, {
  path: 'login',
  component: LoginComponent
}, {
  path: 'auth/:type/:login',
  component: AuthComponent
}, {
  path: 'registration/:login',
  component: RegistrationComponent
}, {
  path: 'navigator',
  component: NavigatorComponent,
  children: [{
    path: 'wallet',
    component: WalletComponent,
    outlet: 'navigator'
  }]
}, {
  path: 'verifier-create',
  component: VerifierCrateComponent
}, {
  path: 'navigator-verifier',
  component: NavigatorVerifierComponent,
  children: [{
    path: 'main',
    component: MainComponent,
    outlet: 'navigator'
  }, {
    path: 'secret-export',
    component: SecretExportComponent,
    outlet: 'navigator'
  }, {
    path: 'delete-secret/:back',
    component: DeleteSecretComponent,
    outlet: 'navigator'
  }]
}];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})

export class AppRoutingModule {
}
