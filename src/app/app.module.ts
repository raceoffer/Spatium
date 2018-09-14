import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatCheckboxModule,
  MatDatepickerModule,
  MatDialogModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatSelectModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatToolbarModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { QRCodeModule } from 'angular2-qrcode';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { CarouselItemDirective } from './directives/carousel-item.directive';
import { EqualToDirective } from './directives/equal-to.directive';
import { CarouselComponent, CarouselItemElement } from './elements/carousel/carousel.component';
import { BluetoothComponent } from './elements/connectivity-manage/bluetooth/bluetooth.component';
import { ConnectivityManageComponent } from './elements/connectivity-manage/connectivity-manage.component';
import { ZeroconfComponent } from './elements/connectivity-manage/zeroconf/zeroconf.component';
import { LogoBlockComponent } from './elements/logo-block/logo-block.component';
import { NumericSpinnerComponent } from './elements/numeric-spinner/numeric-spinner.component';
import { TileCoinComponent } from './elements/tile-coin/tile-coin.component';
import { ToolbarComponent } from './elements/toolbar/toolbar.component';
import { GraphicKeyComponent } from './inputs/graphic-key/graphic-key.component';
import { LoginComponent } from './inputs/login/login.component';
import { NfcReaderComponent } from './inputs/nfc-reader/nfc-reader.component';
import { NfcWriterComponent } from './inputs/nfc-writer/nfc-writer.component';
import { PasswordComponent } from './inputs/password/password.component';
import { PincodeComponent } from './inputs/pincode/pincode.component';
import { QrReaderComponent } from './inputs/qr-reader/qr-reader.component';
import { QrWriterComponent } from './inputs/qr-writer/qr-writer.component';
import { DialogFactorsComponent } from './modals/dialog-factors/dialog-factors.component';
import { AuthComponent } from './screens/auth/auth.component';
import { DefaultAuthFactorComponent } from './screens/authorization-factors/default-auth-factor/default-auth-factor.component';
import { FileAuthFactorComponent } from './screens/authorization-factors/file-auth-factor/file-auth-factor.component';
import { GraphicKeyAuthFactorComponent } from './screens/authorization-factors/graphic-key-auth-factor/graphic-key-auth-factor.component';
import { NfcAuthFactorComponent } from './screens/authorization-factors/nfc-auth-factor/nfc-auth-factor.component';
import { PasswordAuthFactorComponent } from './screens/authorization-factors/password-auth-factor/password-auth-factor.component';
import { PincodeAuthFactorComponent } from './screens/authorization-factors/pincode-auth-factor/pincode-auth-factor.component';
import { QrAuthFactorComponent } from './screens/authorization-factors/qr-auth-factor/qr-auth-factor.component';
import { BackupComponent } from './screens/backup/backup.component';
import { DeleteSecretComponent } from './screens/delete-secret/delete-secret.component';
import { FeedbackComponent } from './screens/feedback/feedback.component';
import { LoginFactorComponent } from './screens/identification-factors/login-factor/login-factor.component';
import { NfcFactorComponent } from './screens/identification-factors/nfc-factor/nfc-factor.component';
import { QrFactorComponent } from './screens/identification-factors/qr-factor/qr-factor.component';
import { LoginComponent as LoginScreenComponent } from './screens/login/login.component';
import { CurrencySettingsComponent } from './screens/navigator/currency-settings/currency-settings.component';
import { CurrencyComponent } from './screens/navigator/currency/currency.component';
import { FactorNodeComponent } from './screens/navigator/factor-node/factor-node.component';
import { IcoDetailsComponent } from './screens/navigator/ico/ico-details/ico-details.component';
import { IcoComponent } from './screens/navigator/ico/ico.component';
import { InvestmentsComponent } from './screens/navigator/ico/investments/investments.component';
import { NewIcoComponent } from './screens/navigator/ico/new-ico/new-ico.component';
import { WhitelistComponent } from './screens/navigator/ico/whitelist/whitelist.component';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { SendTransactionComponent } from './screens/navigator/send-transaction/send-transaction.component';
import { SettingsComponent } from './screens/navigator/settings/settings.component';
import { WaitingComponent } from './screens/navigator/waiting/waiting.component';
import { WalletComponent } from './screens/navigator/wallet/wallet.component';
import { PresentationComponent } from './screens/presentation/presentation.component';
import { RegistrationSuccessComponent } from './screens/registration-success/registration-success.component';
import { RegistrationComponent } from './screens/registration/registration.component';
import { SecretExportComponent } from './screens/secret-export/secret-export.component';
import { SecretImportComponent } from './screens/secret-import/secret-import.component';
import { StartComponent } from './screens/start/start.component';
import { CreateComponent } from './screens/verifier-auth/create/create.component';
import { DecryptComponent } from './screens/verifier-auth/decrypt/decrypt.component';
import { VerifierAuthComponent } from './screens/verifier-auth/verifier-auth.component';
import { ChangePincodeComponent } from './screens/verifier/change-pincode/change-pincode.component';
import { SettingsComponent as VerifierSettingsComponent } from './screens/verifier/settings/verifier-settings.component';
import { VerifierComponent } from './screens/verifier/verifier.component';
import { VerifyTransactionComponent } from './screens/verifier/verify-transaction/verify-transaction.component';
import { ActivityService } from './services/activity.service';
import { AuthService } from './services/auth.service';
import { BluetoothService } from './services/bluetooth.service';
import { ConnectionProviderService } from './services/connection-provider';
import { CurrencyService } from './services/currency.service';
import { DDSService } from './services/dds.service';
import { DeviceService } from './services/device.service';
import { DiscoveryService } from './services/discovery.service';
import { SsdpService } from './services/ssdp.service';
import { FileService } from './services/file.service';
import { HockeyService } from './services/hockey.service';
import { ICOService } from './services/ico.service';
import { IpfsService } from './services/ipfs.service';
import { KeyChainService } from './services/keychain.service';
import { LoggerService } from './services/logger.service';
import { NavigationService } from './services/navigation.service';
import { NotificationService } from './services/notification.service';
import { CurrencyPriceService, PriceService } from './services/price.service';
import { SocketClientService } from './services/socketclient.service';
import { SocketServerService } from './services/socketserver.service';
import { SettingsService } from './services/settings.service';
import { WalletService } from './services/wallet.service';
import { WorkerService } from './services/worker.service';
import { ZeroconfService } from './services/zeroconf.service';
import { NavbarComponent } from './modals/navbar/navbar.component';
import { AddTokenComponent } from './screens/navigator/add-token/add-token.component';
import { RPCServerService } from './services/rpc/rpc-server.service';
import { VerifierService } from './services/verifier.service';
import { CurrencyInfoService } from './services/currencyinfo.service';
import { SyncService } from './services/sync.service';
import { BalanceService } from './services/balance.service';
import { RPCConnectionService } from './services/rpc/rpc-connection.service';
import { DeviceDiscoveryComponent } from './screens/navigator/device-discovery/device-discovery.component';

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
    RegistrationSuccessComponent,
    AutofocusDirective,
    FactorNodeComponent,
    CurrencyComponent,
    CurrencySettingsComponent,
    DeleteSecretComponent,
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
    VerifierAuthComponent,
    VerifierComponent,
    NfcWriterComponent,
    FeedbackComponent,
    ChangePincodeComponent,
    IcoComponent,
    WalletComponent,
    IcoDetailsComponent,
    WhitelistComponent,
    NewIcoComponent,
    InvestmentsComponent,
    BluetoothComponent,
    ZeroconfComponent,
    CreateComponent,
    DecryptComponent,
    VerifierSettingsComponent,
    TileCoinComponent,
    ConnectivityManageComponent,
    CarouselComponent,
    CarouselItemDirective,
    CarouselItemElement,
    PresentationComponent,
    NavbarComponent,
    AddTokenComponent,
    DeviceDiscoveryComponent
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
    MatNativeDateModule,
    MatDatepickerModule,
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
    NavigationService,
    HockeyService,
    ActivityService,
    ICOService,
    DiscoveryService,
    SsdpService,
    IpfsService,
    SocketServerService,
    SocketClientService,
    ZeroconfService,
    ConnectionProviderService,
    SettingsService,
    RPCServerService,
    VerifierService,
    CurrencyInfoService,
    SyncService,
    BalanceService,
    PriceService,
    RPCConnectionService
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
    CurrencySettingsComponent,
    WaitingComponent,
    SendTransactionComponent,
    SecretImportComponent,
    SecretExportComponent,
    DeleteSecretComponent,
    VerifyTransactionComponent,
    NfcFactorComponent,
    ChangePincodeComponent,
    IcoDetailsComponent,
    WhitelistComponent,
    NewIcoComponent,
    InvestmentsComponent,
    IcoComponent,
    FeedbackComponent,
    CreateComponent,
    DecryptComponent,
    VerifierSettingsComponent,
    ZeroconfComponent,
    BluetoothComponent,
    PresentationComponent,
    NavbarComponent,
    BackupComponent,
    AddTokenComponent,
    DeviceDiscoveryComponent,
  ]
})

export class AppModule {
}
