import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare const cordova: any;

@Injectable()
export class WiFiService {
    public available: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public enabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public connected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor() {
        cordova.plugins.ssdp.isAvailable().then(available => this.available.next(available));
        cordova.plugins.ssdp.isEnabled().then(enabled => this.enabled.next(enabled));
        cordova.plugins.ssdp.isConnected().then(connected => this.connected.next(connected));

        cordova.plugins.ssdp.setAvailabilityChangedCallback(available => this.available.next(available));
        cordova.plugins.ssdp.setAdapterStatusChangedCallback(enabled => this.enabled.next(enabled));
        cordova.plugins.ssdp.setConnectionChangedCallback(connected => this.connected.next(connected));
    }
}