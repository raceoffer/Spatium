import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule, BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatInputModule,
  MatDialogModule,
  MatSelectModule,
  MatSnackBarModule,
  MatFormFieldModule,
  MatGridListModule
} from '@angular/material';
import { QRCodeModule } from 'angular2-qrcode';
import { OverlayContainer } from '@angular/cdk/overlay';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { StartComponent } from './screens/start/start.component';
import { ConnectComponent } from './screens/connect/connect.component';
import { WaitingComponent } from './screens/waiting/waiting.component';
import { ClipboardModule} from 'ngx-clipboard/dist';
import { BackupComponent } from './screens/backup/backup.component';
import { SendTransactionComponent } from './screens/navigator/send-transaction/send-transaction.component';
import { VerifyTransactionComponent } from './screens/navigator-verifier/verify-transaction/verify-transaction.component';
import { WalletService } from './services/wallet.service';
import { LoggerService } from './services/logger.service';
import { BluetoothService } from './services/bluetooth.service';
import { AuthService } from './services/auth.service';
import { FileService } from './services/file.service';
import { NotificationService } from './services/notification.service';
import { DDSService } from './services/dds.service';
import { PincodeComponent } from './screens/pincode/pincode.component';
import { LoginComponent } from './screens/login/login.component';
import { AuthComponent } from './screens/auth/auth.component';
import { DialogFactorsComponent } from './screens/dialog-factors/dialog-factors.component';
import { PasswordComponent } from './screens/password/password.component';
import { FileUploadComponent } from './screens/file-upload/file-upload.component';
import { GraphicKeyComponent } from './screens/graphic-key/graphic-key.component';
import { QrCodeComponent } from './screens/qr-code/qr-code.component';
import { NfcComponent } from './screens/nfc/nfc.component';
import { NgxZxingModule } from 'ngx-zxing';
import { FactorParentComponent } from './screens/factor/factor-parent.component';
import { LoginParentComponent } from './screens/login-parent/login-parent.component';
import { NgInitDirective } from './directives/ng-init.directive';
import { RegistrationComponent } from './screens/registration/registration.component';
import { KeyChainService } from './services/keychain.service';
import { WalletComponent } from './screens/navigator/wallet/wallet.component';
import { RegistrationSuccessComponent } from './screens/registration-success/registration-success.component';
import { FingerPrintComponent } from './screens/finger-print/finger-print.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { FactorNodeComponent } from './screens/navigator/factor-node/factor-node.component';
import { SettingsComponent } from './screens/navigator/settings/settings.component';
import { CurrencyComponent } from './screens/navigator/currency/currency.component';
import { MainDrawerComponent } from './elements/main-drawer/main-drawer.component';
import { NavigatorVerifierComponent } from './screens/navigator-verifier/navigator-verifier.component';
import { VerifyWaitingComponent } from './screens/verify-waiting/verify-waiting.component';
import { SecretExportComponent } from './screens/secret-export/secret-export.component';
import { SecretImportComponent } from './screens/secret-import/secret-import.component';
import { DeleteSecretComponent } from './screens/navigator-verifier/delete-secret/delete-secret.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigatorComponent,
    StartComponent,
    ConnectComponent,
    WaitingComponent,
    BackupComponent,
    SendTransactionComponent,
    VerifyTransactionComponent,
    PincodeComponent,
    LoginComponent,
    AuthComponent,
    DialogFactorsComponent,
    PasswordComponent,
    FileUploadComponent,
    GraphicKeyComponent,
    QrCodeComponent,
    NfcComponent,
    FactorParentComponent,
    LoginParentComponent,
    RegistrationComponent,
    NgInitDirective,
    WalletComponent,
    RegistrationSuccessComponent,
    FingerPrintComponent,
    AutofocusDirective,
    FactorNodeComponent,
    CurrencyComponent,
    DeleteSecretComponent,
    MainDrawerComponent,
    NavigatorVerifierComponent,
    VerifyWaitingComponent,
    SecretExportComponent,
    SecretImportComponent,
    SettingsComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserModule,
    NoopAnimationsModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatInputModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    FlexLayoutModule,
    MatSlideToggleModule,
    ClipboardModule,
    MatDialogModule,
    MatSelectModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatGridListModule,
    QRCodeModule,
    NgxZxingModule.forRoot()
  ],
  providers: [
    WalletService,
    BluetoothService,
    LoggerService,
    AuthService,
    FileService,
    NotificationService,
    DDSService,
    KeyChainService
  ],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    DialogFactorsComponent
  ]
})

export class AppModule {
  constructor(overlayContainer: OverlayContainer) {
    // overlayContainer.getContainerElement().classList.add('dark-theme');
  }
}
