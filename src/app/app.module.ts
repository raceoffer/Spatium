import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {NgModule} from '@angular/core';
import {
    MatButtonModule,
    MatIconModule,
    MatInputModule,
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

@NgModule({
    declarations: [
        AppComponent,
        ToolbarComponent,
        BluetoothScreen,
        ConnectScreen,
        WalletScreen
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
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
        ConnectScreen,
        WalletScreen]
})

export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
