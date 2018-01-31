import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule, BrowserAnimationsModule} from '@angular/platform-browser/animations';
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
  MatFormFieldModule
} from '@angular/material';
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
import { SendTransactionComponent } from './screens/send-transaction/send-transaction.component';
import { VerifyTransactionComponent } from './screens/verify-transaction/verify-transaction.component';
import { WalletService } from './services/wallet.service';
import { LoggerService } from './services/logger.service';
import { BluetoothService } from './services/bluetooth.service';
import { AuthService } from './services/auth.service';
import { FileService } from './services/file.service';
import { NotificationService } from './services/notification.service';
import { BitcoinKeyFragmentService } from './services/bitcoin-key-fragment.service';
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
import { NgInitDirective } from './ng-init.directive';



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
    NgInitDirective
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
    NgxZxingModule.forRoot()
  ],
  providers: [
    WalletService,
    BitcoinKeyFragmentService,
    BluetoothService,
    LoggerService,
    AuthService,
    FileService,
    NotificationService
  ],
  bootstrap: [
    AppComponent,
    DialogFactorsComponent
  ]
})
export class AppModule {
  constructor(overlayContainer: OverlayContainer) {
    // overlayContainer.getContainerElement().classList.add('dark-theme');
  }
}
