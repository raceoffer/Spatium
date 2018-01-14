import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule, BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatButtonModule,
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
} from '@angular/material';
import { OverlayContainer } from '@angular/cdk/overlay';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NavigatorComponent } from './screens/navigator/navigator.component';
import { StartComponent } from './screens/start/start.component';
import { InitiatorAuthComponent } from './screens/initiator-auth/initiator-auth.component';
import { VerifierAuthComponent } from './screens/verifier-auth/verifier-auth.component';
import { ConnectComponent } from './screens/connect/connect.component';
import { WaitingComponent } from './screens/waiting/waiting.component';
import { ClipboardModule} from 'ngx-clipboard/dist';
import { BackupComponent } from './screens/backup/backup.component';
import { SendTransactionComponent } from './screens/send-transaction/send-transaction.component';
import { WalletService } from './services/wallet.service';
import { BluetoothService } from './services/bluetooth.service';
import { BitcoinKeyFragmentService } from './services/bitcoin-key-fragment.service';
import { PincodeComponent } from './screens/pincode/pincode.component';


@NgModule({
  declarations: [
    AppComponent,
    NavigatorComponent,
    StartComponent,
    InitiatorAuthComponent,
    VerifierAuthComponent,
    ConnectComponent,
    WaitingComponent,
    BackupComponent,
    SendTransactionComponent,
    PincodeComponent
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
    MatSnackBarModule
  ],
  providers: [
    WalletService,
    BitcoinKeyFragmentService,
    BluetoothService,
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
  constructor(overlayContainer: OverlayContainer) {
    // overlayContainer.getContainerElement().classList.add('dark-theme');
  }
}
