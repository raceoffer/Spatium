import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { StartComponent } from './screens/start/start.component';
import { WaitingComponent } from './screens/waiting/waiting.component';
import { BackupComponent } from './screens/backup/backup.component';
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
import { WalletComponent } from './screens/wallet/wallet.component';
import { RegistrationSuccessComponent } from './screens/registration-success/registration-success.component';
import { FingerPrintComponent } from './screens/finger-print/finger-print.component';
import { CurrencyComponent } from './screens/currency/currency.component';
import { VerifyWaitingComponent } from './screens/verify-waiting/verify-waiting.component';
import { SendTransactionComponent } from './screens/navigator/send-transaction/send-transaction.component';
import { NavigatorVerifierComponent } from './screens/navigator-verifier/navigator-verifier.component';
import { SecretExportComponent } from './screens/secret-export/secret-export.component';
import { SecretDeleteComponent } from './screens/secret-delete/secret-delete.component';

const appRoutes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  { path: 'start', component: StartComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'backup', component: BackupComponent},
  { path: 'waiting', component: WaitingComponent },
  { path: 'verify-waiting', component: VerifyWaitingComponent },
  { path: 'login', component: LoginParentComponent},
  { path: 'registration', component: RegistrationComponent},
  { path: 'reg-success', component: RegistrationSuccessComponent},
  { path: 'fingerprint', component: FingerPrintComponent},
  { path: 'secret-export', component: SecretExportComponent},
  { path: 'secret-delete', component: SecretDeleteComponent},
  { path: 'factor', component: FactorParentComponent, children: [
    { path: 'pincode', component: PincodeComponent, outlet: 'factor' },
    { path: 'password', component: PasswordComponent, outlet: 'factor' },
    { path: 'file-upload', component: FileUploadComponent, outlet: 'factor' },
    { path: 'graphic-key', component: GraphicKeyComponent, outlet: 'factor' },
    { path: 'qr-code', component: QrCodeComponent, outlet: 'factor' },
    { path: 'nfc', component: NfcComponent, outlet: 'factor' }
  ]},
  { path: 'navigator/:back', component: NavigatorComponent, children: [
    { path: 'wallet', component: WalletComponent, outlet: 'navigator' },
    { path: 'currency/:coin', component: CurrencyComponent, outlet: 'navigator' },
    { path: 'send-transaction/:coin', component: SendTransactionComponent, outlet: 'navigator' }
  ]},
  { path: 'navigator-verifier', component: NavigatorVerifierComponent}
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
