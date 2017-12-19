import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {NgModule} from '@angular/core';
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatToolbarModule
} from '@angular/material';
import {FlexLayoutModule} from '@angular/flex-layout';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ClipboardModule} from 'ngx-clipboard';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {ToolbarComponent} from './toolbar/toolbar.component';
import {BluetoothScreenComponent, ConnectedDevicesDialogComponent} from './screens/bluetooth/bluetooth.component';
import {ConnectScreenComponent} from './screens/connect/connect.component';
import {BackupBalanceDialogComponent, WalletScreenComponent} from './screens/wallet/wallet.component';
import {SendTransactionDialogComponent} from './dialogs/transaction/send/send.transaction.dialog';
import {ConfirmTransactionDialogComponent} from './dialogs/transaction/confirm/confirm.transaction.dialog';

@NgModule({
  declarations: [
    AppComponent,
    ToolbarComponent,
    BluetoothScreenComponent,
    ConnectedDevicesDialogComponent,
    ConnectScreenComponent,
    WalletScreenComponent,
    BackupBalanceDialogComponent,
    SendTransactionDialogComponent,
    ConfirmTransactionDialogComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ClipboardModule,
    FlexLayoutModule
  ],
  providers: [],
  bootstrap: [
    AppComponent,
    ToolbarComponent],
  entryComponents: [
    ConnectedDevicesDialogComponent,
    BackupBalanceDialogComponent,
    SendTransactionDialogComponent,
    ConfirmTransactionDialogComponent
  ]
})

export class AppModule {
}

platformBrowserDynamic().bootstrapModule(AppModule);
