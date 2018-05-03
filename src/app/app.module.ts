import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatCheckboxModule,
  MatDialogModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatSelectModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatToolbarModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QRCodeModule } from 'angular2-qrcode';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { NgInitDirective } from './directives/ng-init.directive';
import { LogoBlockComponent } from './elements/logo-block/logo-block.component';
import { MainDrawerComponent } from './elements/main-drawer/main-drawer.component';
import { NumericSpinnerComponent } from './elements/numeric-spinner/numeric-spinner.component';
import { ToolbarComponent } from './elements/toolbar/toolbar.component';
import { DialogFactorsComponent } from './modals/dialog-factors/dialog-factors.component';
import { FactorParentOverlayComponent } from './modals/factor-parent-overlay/factor-parent-overlay.component';
import { FactorParentOverlayService } from './modals/factor-parent-overlay/factor-parent-overlay.service';
import { AuthComponent } from './screens/auth/auth.component';
import { BackupComponent } from './screens/backup/backup.component';
import { ConfirmationEntryComponent } from './screens/confirmation-entry/confirmation-entry.component';
import { FileUploadComponent } from './screens/factors/file-upload/file-upload.component';
import { GraphicKeyComponent } from './screens/factors/graphic-key/graphic-key.component';
import { LoginComponent as LoginComponentFactor } from './screens/factors/login/login.component';
import { NfcReaderComponent } from './screens/factors/nfc-reader/nfc-reader.component';
import { NfcWriterComponent } from './screens/factors/nfc-writer/nfc-writer.component';
import { PasswordComponent } from './screens/factors/password/password.component';
import { PincodeComponent } from './screens/factors/pincode/pincode.component';
import { QrReaderComponent } from './screens/factors/qr-reader/qr-reader.component';
import { QrWriterComponent } from './screens/factors/qr-writer/qr-writer.component';
import { LoginParentComponent } from './screens/login-parent/login-parent.component';
import { LoginComponent } from './screens/login/login.component';
import { DeleteSecretComponent } from './screens/navigator-verifier/delete-secret/delete-secret.component';
import { ConnectComponent } from './screens/navigator-verifier/main-contents/connect/connect.component';
import { VerifyTransactionComponent } from './screens/navigator-verifier/main-contents/verify-transaction/verify-transaction.component';
import { VerifyWaitingComponent } from './screens/navigator-verifier/main-contents/verify-waiting/verify-waiting.component';
import { MainComponent } from './screens/navigator-verifier/main/main.component';
import { NavigatorVerifierComponent } from './screens/navigator-verifier/navigator-verifier.component';
import { SecretExportComponent } from './screens/navigator-verifier/secret-export/secret-export.component';
import { CurrencySettingsComponent } from './screens/navigator/currency-settings/currency-settings.component';
import { CurrencyComponent } from './screens/navigator/currency/currency.component';
import { FactorNodeComponent } from './screens/navigator/factor-node/factor-node.component';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { SendTransactionComponent } from './screens/navigator/send-transaction/send-transaction.component';
import { SettingsComponent } from './screens/navigator/settings/settings.component';
import { WaitingComponent } from './screens/navigator/waiting/waiting.component';
import { WalletComponent } from './screens/navigator/wallet/wallet.component';
import { RegistrationSuccessComponent } from './screens/registration-success/registration-success.component';
import { RegistrationComponent } from './screens/registration/registration.component';
import { SecretImportComponent } from './screens/secret-import/secret-import.component';
import { StartComponent } from './screens/start/start.component';
import { AuthService } from './services/auth.service';
import { BluetoothService } from './services/bluetooth.service';
import { CurrencyService } from './services/currency.service';
import { DDSService } from './services/dds.service';
import { FileService } from './services/file.service';
import { KeyChainService } from './services/keychain.service';
import { LoggerService } from './services/logger.service';
import { NavigationService } from './services/navigation.service';
import { NotificationService } from './services/notification.service';
import { CurrencyPriceService } from './services/price.service';
import { WalletService } from './services/wallet.service';

@NgModule({
  declarations: [
    AppComponent,
    NavigatorComponent,
    StartComponent,
    ConnectComponent,
    WaitingComponent,
    SendTransactionComponent,
    VerifyTransactionComponent,
    PincodeComponent,
    LoginComponent,
    AuthComponent,
    DialogFactorsComponent,
    PasswordComponent,
    FileUploadComponent,
    GraphicKeyComponent,
    LoginParentComponent,
    RegistrationComponent,
    NgInitDirective,
    WalletComponent,
    RegistrationSuccessComponent,
    AutofocusDirective,
    FactorNodeComponent,
    CurrencyComponent,
    DeleteSecretComponent,
    MainDrawerComponent,
    NavigatorVerifierComponent,
    VerifyWaitingComponent,
    SecretExportComponent,
    SecretImportComponent,
    SettingsComponent,
    LogoBlockComponent,
    NumericSpinnerComponent,
    CurrencySettingsComponent,
    BackupComponent,
    ToolbarComponent,
    ConfirmationEntryComponent,
    FactorParentOverlayComponent,
    NfcReaderComponent,
    NfcWriterComponent,
    QrReaderComponent,
    QrWriterComponent,
    MainComponent,
    LoginComponentFactor
  ],
  imports: [
    OverlayModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserModule,
    NoopAnimationsModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatRadioModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatInputModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    FlexLayoutModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatSelectModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatGridListModule,
    QRCodeModule,
    ZXingScannerModule.forRoot()
  ],
  providers: [
    WalletService,
    CurrencyPriceService,
    BluetoothService,
    LoggerService,
    AuthService,
    FileService,
    NotificationService,
    DDSService,
    KeyChainService,
    CurrencyService,
    NavigationService,
    FactorParentOverlayService
  ],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    DialogFactorsComponent,
    FactorParentOverlayComponent,
    PincodeComponent,
    PasswordComponent,
    FileUploadComponent,
    GraphicKeyComponent,
    NfcReaderComponent,
    NfcWriterComponent,
    QrReaderComponent,
    QrWriterComponent,
    LoginComponentFactor
  ]
})

export class AppModule {
}
