import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './screens/auth/auth.component';
import { LoginComponent } from './screens/login/login.component';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { RegistrationComponent } from './screens/registration/registration.component';
import { StartComponent } from './screens/start/start.component';
import { VerifierCrateComponent } from "./screens/verifier-crate/verifier-crate.component";
import { VerifierComponent } from "./screens/verifier/verifier.component";
import { WalletComponent } from "./screens/navigator/wallet/wallet.component";
import { IcoComponent } from "./screens/navigator/ico/ico.component";

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
    }, {
      path: 'ico',
      component: IcoComponent,
      outlet: 'navigator'
    }]
}, {
  path: 'verifier-create',
  component: VerifierCrateComponent
}, {
  path: 'verifier',
  component: VerifierComponent
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
