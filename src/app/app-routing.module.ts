import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { StartComponent } from './screens/start/start.component';
import { WaitingComponent } from './screens/waiting/waiting.component';
import { PincodeComponent } from './screens/pincode/pincode.component';
import { AuthComponent } from './screens/auth/auth.component';
import { PasswordComponent } from './screens/password/password.component';
import { FileUploadComponent } from './screens/file-upload/file-upload.component';
import { GraphicKeyComponent } from './screens/graphic-key/graphic-key.component';
import { QrCodeComponent } from './screens/qr-code/qr-code.component';
import { NfcComponent } from './screens/nfc/nfc.component';
import { FactorParentComponent } from './screens/factor/factor-parent.component';
import { LoginParentComponent } from './screens/login-parent/login-parent.component';
import { RegistrationComponent } from './screens/registration/registration.component';
import { FactorNodeComponent } from './screens/navigator/factor-node/factor-node.component';
import { WalletComponent } from './screens/navigator/wallet/wallet.component';
import { RegistrationSuccessComponent } from './screens/registration-success/registration-success.component';
import { FingerPrintComponent } from './screens/finger-print/finger-print.component';
import { CurrencyComponent } from './screens/navigator/currency/currency.component';
import { VerifyWaitingComponent } from './screens/verify-waiting/verify-waiting.component';
import { SendTransactionComponent } from './screens/navigator/send-transaction/send-transaction.component';
import { NavigatorVerifierComponent } from './screens/navigator-verifier/navigator-verifier.component';
import { SecretImportComponent } from './screens/secret-import/secret-import.component';
import { VerifyTransactionComponent } from './screens/navigator-verifier/verify-transaction/verify-transaction.component';
import { SettingsComponent } from './screens/navigator/settings/settings.component';
import { DeleteSecretComponent } from './screens/navigator-verifier/delete-secret/delete-secret.component';
import {SecretExportComponent} from './screens/navigator-verifier/secret-export/secret-export.component';

const appRoutes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  { path: 'start', component: StartComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'waiting', component: WaitingComponent },
  { path: 'verify-waiting', component: VerifyWaitingComponent },
  { path: 'login', component: LoginParentComponent},
  { path: 'registration', component: RegistrationComponent},
  { path: 'reg-success', component: RegistrationSuccessComponent},
  { path: 'fingerprint', component: FingerPrintComponent},
  { path: 'factornode', component: FactorNodeComponent},
  { path: 'secret-import', component: SecretImportComponent},
  { path: 'factor', component: FactorParentComponent, children: [
    { path: 'pincode', component: PincodeComponent, outlet: 'factor' },
    { path: 'password', component: PasswordComponent, outlet: 'factor' },
    { path: 'file-upload', component: FileUploadComponent, outlet: 'factor' },
    { path: 'graphic-key', component: GraphicKeyComponent, outlet: 'factor' },
    { path: 'qr-code', component: QrCodeComponent, outlet: 'factor' },
    { path: 'nfc', component: NfcComponent, outlet: 'factor' }
  ]},
  { path: 'navigator', component: NavigatorComponent, children: [
    { path: 'wallet', component: WalletComponent, outlet: 'navigator' },
    { path: 'currency/:coin', component: CurrencyComponent, outlet: 'navigator' },
    { path: 'send-transaction/:coin', component: SendTransactionComponent, outlet: 'navigator' },
    { path: 'settings', component: SettingsComponent, outlet: 'navigator' },
    { path: 'factornode', component: FactorNodeComponent, outlet: 'navigator' },
    { path: 'factor', component: FactorParentComponent, outlet: 'navigator', children: [
      { path: 'pincode', component: PincodeComponent, outlet: 'factor' },
      { path: 'password', component: PasswordComponent, outlet: 'factor' },
      { path: 'file-upload', component: FileUploadComponent, outlet: 'factor' },
      { path: 'graphic-key', component: GraphicKeyComponent, outlet: 'factor' },
      { path: 'qr-code', component: QrCodeComponent, outlet: 'factor' },
      { path: 'nfc', component: NfcComponent, outlet: 'factor' }
    ]}
  ]},
  { path: 'navigator-verifier', component: NavigatorVerifierComponent, children: [
    { path: 'verify-transaction', component: VerifyTransactionComponent, outlet: 'navigator' },
    { path: 'secret-export', component: SecretExportComponent, outlet: 'navigator' },
    { path: 'delete-secret/:back', component: DeleteSecretComponent, outlet: 'navigator' }
  ]},
  { path: 'delete-secret/:back', component: DeleteSecretComponent }
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
