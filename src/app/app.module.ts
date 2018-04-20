import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NoopAnimationsModule, BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatCheckboxModule,
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatToolbarModule,
  MatInputModule,
  MatDialogModule,
  MatSelectModule,
  MatSnackBarModule,
  MatFormFieldModule,
  MatGridListModule
} from '@angular/material';
import { QRCodeModule } from 'angular2-qrcode';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { StartComponent } from './screens/start/start.component';
import { ConnectComponent } from './screens/connect/connect.component';
import { WaitingComponent } from './screens/waiting/waiting.component';
import { SendTransactionComponent } from './screens/navigator/send-transaction/send-transaction.component';
import { VerifyTransactionComponent } from './screens/navigator-verifier/verify-transaction/verify-transaction.component';
import { WalletService } from './services/wallet.service';
import { LoggerService } from './services/logger.service';
import { BluetoothService } from './services/bluetooth.service';
import { AuthService } from './services/auth.service';
import { FileService } from './services/file.service';
import { NotificationService } from './services/notification.service';
import { DDSService } from './services/dds.service';
import { PincodeComponent } from './screens/factors/pincode/pincode.component';
import { LoginComponent } from './screens/login/login.component';
import { AuthComponent } from './screens/auth/auth.component';
import { DialogFactorsComponent } from './screens/dialog-factors/dialog-factors.component';
import { PasswordComponent } from './screens/factors/password/password.component';
import { FileUploadComponent } from './screens/factors/file-upload/file-upload.component';
import { GraphicKeyComponent } from './screens/factors/graphic-key/graphic-key.component';
import { QrCodeComponent } from './screens/factors/qr-code/qr-code.component';
import { NfcComponent } from './screens/factors/nfc/nfc.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { FactorParentComponent } from './screens/factor-parent/factor-parent.component';
import { LoginParentComponent } from './screens/login-parent/login-parent.component';
import { NgInitDirective } from './directives/ng-init.directive';
import { RegistrationComponent } from './screens/registration/registration.component';
import { KeyChainService } from './services/keychain.service';
import { WalletComponent } from './screens/navigator/wallet/wallet.component';
import { RegistrationSuccessComponent } from './screens/registration-success/registration-success.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { FactorNodeComponent } from './screens/navigator/factor-node/factor-node.component';
import { SettingsComponent } from './screens/navigator/settings/settings.component';
import { CurrencyComponent } from './screens/navigator/currency/currency.component';
import { MainDrawerComponent } from './elements/main-drawer/main-drawer.component';
import { NavigatorVerifierComponent } from './screens/navigator-verifier/navigator-verifier.component';
import { VerifyWaitingComponent } from './screens/verify-waiting/verify-waiting.component';
import { SecretImportComponent } from './screens/secret-import/secret-import.component';
import { DeleteSecretComponent } from './screens/navigator-verifier/delete-secret/delete-secret.component';
import { SecretExportComponent } from './screens/navigator-verifier/secret-export/secret-export.component';
import { CurrencyService } from './services/currency.service';
import { NavigationService } from './services/navigation.service';
import { CurrencyPriceService } from './services/price.service';
import { LogoBlockComponent } from './elements/logo-block/logo-block.component';
import { NumericSpinnerComponent } from './elements/numeric-spinner/numeric-spinner.component';
import { ToolbarComponent } from './elements/toolbar/toolbar.component';
import { ConfirmationEntryComponent } from './screens/confirmation-entry/confirmation-entry.component';
import { FactorParentOverlayComponent } from './screens/factor-parent-overlay/factor-parent-overlay.component';
import { FactorParentOverlayService } from './screens/factor-parent-overlay/factor-parent-overlay.service';
import { NfcReaderComponent } from './screens/factors/nfc-reader/nfc-reader.component';
import { NfcWriterComponent } from './screens/factors/nfc-writer/nfc-writer.component';
import { QrReaderComponent } from './screens/factors/qr-reader/qr-reader.component';
import { QrWriterComponent } from './screens/factors/qr-writer/qr-writer.component';


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
    QrCodeComponent,
    NfcComponent,
    FactorParentComponent,
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
    ToolbarComponent,
    ConfirmationEntryComponent,
    FactorParentOverlayComponent,
    NfcReaderComponent,
    NfcWriterComponent,
    QrReaderComponent,
    QrWriterComponent
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
    QrWriterComponent
  ]
})

export class AppModule {}
