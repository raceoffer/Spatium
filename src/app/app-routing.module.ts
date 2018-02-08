import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { StartComponent } from './screens/start/start.component';
import { WaitingComponent } from './screens/waiting/waiting.component';
import { BackupComponent } from './screens/backup/backup.component';
import { SendTransactionComponent } from './screens/send-transaction/send-transaction.component';
import { VerifyTransactionComponent } from './screens/verify-transaction/verify-transaction.component';
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
import {RegistrationSuccessComponent} from "./screens/registration-success/registration-success.component";
import {FingerPrintComponent} from "./screens/finger-print/finger-print.component";
import {NavigatorVerifierComponent} from "./screens/navigator-verifier/navigator-verifier.component";
import {CreateComponent} from "./screens/create/create.component";
import {SignInComponent} from "./screens/sign-in/sign-in.component";
import {ImportComponent} from "./screens/import/import.component";
import {ExportComponent} from "./screens/export/export.component";
import {DeleteComponent} from "./screens/delete/delete.component";

const appRoutes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  { path: 'verifyTransaction', component: VerifyTransactionComponent },
  { path: 'start', component: StartComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'backup', component: BackupComponent},
  { path: 'waiting', component: WaitingComponent },
  { path: 'login', component: LoginParentComponent},
  { path: 'registration', component: RegistrationComponent},
  { path: 'reg-success', component: RegistrationSuccessComponent},
  { path: 'fingerprint', component: FingerPrintComponent},
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
    { path: 'send-transaction', component: SendTransactionComponent, outlet: 'navigator' }
  ]},
  { path: 'navigator_verifier', component: NavigatorVerifierComponent, children: [
    { path: 'create',  component: CreateComponent, outlet: 'navigator_verifier' },
    { path: 'sign_in', component: SignInComponent, outlet: 'navigator_verifier' },
    { path: 'import',  component: ImportComponent, outlet: 'navigator_verifier' },
    { path: 'export',  component: ExportComponent, outlet: 'navigator_verifier' },
    { path: 'delete',  component: DeleteComponent, outlet: 'navigator_verifier' }
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
