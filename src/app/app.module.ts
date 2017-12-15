import {BrowserModule} from '@angular/platform-browser';
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
import {BluetoothScreen} from './screens/bluetooth/bluetooth.component';
import {ConnectScreen} from './screens/connect/connect.component';
import {WalletScreen} from './screens/wallet/wallet.component';
import {ConnectedDevicesDialog} from './screens/bluetooth/bluetooth.component';

@NgModule({
    declarations: [
        AppComponent,
        ToolbarComponent,
        BluetoothScreen,
        ConnectedDevicesDialog,
        ConnectScreen,
        WalletScreen
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
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
        ToolbarComponent,
        BluetoothScreen,
        ConnectedDevicesDialog,
        ConnectScreen,
        WalletScreen]
})

export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
