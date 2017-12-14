import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {NgModule} from '@angular/core';
import {
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatToolbarModule
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppComponent} from './app.component';
import {ToolbarComponent} from './toolbar/toolbar.component';
import {BluetoothScreen} from './screens/bluetooth/bluetooth.component';

@NgModule({
    declarations: [
        AppComponent,
        ToolbarComponent,
        BluetoothScreen
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatToolbarModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
    ],
    providers: [],
    bootstrap: [
        AppComponent,
        ToolbarComponent,
        BluetoothScreen]
})

export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
