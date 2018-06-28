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
import { QRCodeModule } from 'angular2-qrcode';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { LongPressDirective } from './directives/long-press.directive';
import { LogoBlockComponent } from './elements/logo-block/logo-block.component';
import { MainDrawerComponent } from './elements/main-drawer/main-drawer.component';
import { NumericSpinnerComponent } from './elements/numeric-spinner/numeric-spinner.component';
import { ToolbarComponent } from './elements/toolbar/toolbar.component';
import { DialogFactorsComponent } from './modals/dialog-factors/dialog-factors.component';
import { AuthComponent } from './screens/auth/auth.component';
import { BackupComponent } from './screens/backup/backup.component';
import { LoginFactorComponent } from './screens/identification-factors/login-factor/login-factor.component';
import { FileAuthFactorComponent } from './screens/authorization-factors/file-auth-factor/file-auth-factor.component';
import { GraphicKeyAuthFactorComponent } from './screens/authorization-factors/graphic-key-auth-factor/graphic-key-auth-factor.component';
import { PasswordAuthFactorComponent } from './screens/authorization-factors/password-auth-factor/password-auth-factor.component';
import { PincodeAuthFactorComponent } from './screens/authorization-factors/pincode-auth-factor/pincode-auth-factor.component';
import { LoginComponent as LoginScreenComponent } from './screens/login/login.component';
import { DeleteSecretComponent } from './screens/delete-secret/delete-secret.component';
import { VerifyTransactionComponent } from './screens/verifier/verify-transaction/verify-transaction.component';
import { SecretExportComponent } from './screens/secret-export/secret-export.component';
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
import { WorkerService } from './services/worker.service';
import { DeviceService } from './services/device.service';
import { PasswordComponent } from './inputs/password/password.component';
import { PincodeComponent } from './inputs/pincode/pincode.component';
import { NfcAuthFactorComponent } from "./screens/authorization-factors/nfc-auth-factor/nfc-auth-factor.component";
import { QrAuthFactorComponent } from "./screens/authorization-factors/qr-auth-factor/qr-auth-factor.component";
import { QrFactorComponent } from "./screens/identification-factors/qr-factor/qr-factor.component";
import { NfcFactorComponent } from "./screens/identification-factors/nfc-factor/nfc-factor.component";
import { GraphicKeyComponent } from './inputs/graphic-key/graphic-key.component';
import { QrReaderComponent } from './inputs/qr-reader/qr-reader.component';
import { NfcReaderComponent } from './inputs/nfc-reader/nfc-reader.component';
import { LoginComponent } from "./inputs/login/login.component";
import { QrWriterComponent } from './inputs/qr-writer/qr-writer.component';
import { DefaultAuthFactorComponent } from './screens/authorization-factors/default-auth-factor/default-auth-factor.component';
import { EqualToDirective } from './directives/equal-to.directive';
import { VerifierCrateComponent } from './screens/verifier-crate/verifier-crate.component';
import { VerifierComponent } from './screens/verifier/verifier.component';
import { NfcWriterComponent } from './inputs/nfc-writer/nfc-writer.component';
import { IcoComponent } from './screens/navigator/ico/ico.component';
import { MainComponent } from './screens/navigator/main/main.component';
import { IcoDetailsComponent } from './screens/navigator/ico/ico-details/ico-details.component';
import { NewIcoComponent } from './screens/navigator/ico/new-ico/new-ico.component';
import { WhitelistComponent } from './screens/navigator/ico/whitelist/whitelist.component';
import { InvestmentsComponent } from './screens/navigator/ico/investments/investments.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigatorComponent,
    StartComponent,
    WaitingComponent,
    SendTransactionComponent,
    VerifyTransactionComponent,
    PincodeAuthFactorComponent,
    LoginComponent,
    AuthComponent,
    DialogFactorsComponent,
    PasswordAuthFactorComponent,
    FileAuthFactorComponent,
    GraphicKeyAuthFactorComponent,
    NfcAuthFactorComponent,
    NfcFactorComponent,
    QrAuthFactorComponent,
    QrFactorComponent,
    LoginScreenComponent,
    RegistrationComponent,
    LongPressDirective,
    RegistrationSuccessComponent,
    AutofocusDirective,
    FactorNodeComponent,
    CurrencyComponent,
    DeleteSecretComponent,
    MainDrawerComponent,
    SecretExportComponent,
    SecretImportComponent,
    SettingsComponent,
    LogoBlockComponent,
    NumericSpinnerComponent,
    CurrencySettingsComponent,
    BackupComponent,
    ToolbarComponent,
    LoginFactorComponent,
    PasswordComponent,
    PincodeComponent,
    GraphicKeyComponent,
    QrReaderComponent,
    NfcReaderComponent,
    QrWriterComponent,
    DefaultAuthFactorComponent,
    EqualToDirective,
    VerifierCrateComponent,
    VerifierComponent,
    NfcWriterComponent,
    IcoComponent,
    MainComponent,
    WalletComponent,
    IcoDetailsComponent,
    WhitelistComponent,
    NewIcoComponent,
    InvestmentsComponent
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
    MatSnackBarModule,
    QRCodeModule
  ],
  providers: [
    DeviceService,
    WorkerService,
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
    NavigationService
  ],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    DialogFactorsComponent,
    DefaultAuthFactorComponent,
    PasswordAuthFactorComponent,
    PincodeAuthFactorComponent,
    GraphicKeyAuthFactorComponent,
    QrAuthFactorComponent,
    NfcAuthFactorComponent,
    RegistrationSuccessComponent,
    SettingsComponent,
    FactorNodeComponent,
    LoginFactorComponent,
    QrFactorComponent,
    CurrencyComponent,
    WaitingComponent,
    SendTransactionComponent,
    SecretImportComponent,
    SecretExportComponent,
    DeleteSecretComponent,
    VerifyTransactionComponent,
    NfcFactorComponent,
    IcoDetailsComponent,
    WhitelistComponent,
    NewIcoComponent,
    InvestmentsComponent
  ]
})

export class AppModule {
}
