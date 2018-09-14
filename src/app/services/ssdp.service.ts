import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Device } from './primitives/device';
import { State } from './primitives/state';
import { ProviderType } from './interfaces/connection-provider';

declare const cordova: any;

@Injectable()
export class SsdpService {
    public advertising: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
    public discovering: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
    
    public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());
    
    private target = 'spatium';

    constructor() {
        console.log('ssdp - set callbacks');
        cordova.plugins.ssdp.setDiscoveredCallback(data => {
            console.log('ssdp - discovered:', data);
            const devices = this.devices.getValue();
            devices.set(data.usn, new Device(
                ProviderType.SSDP,
                data.name,
                data.usn,
                data.ip,
                parseInt(data.port)
            ));
            this.devices.next(devices);
        });

        cordova.plugins.ssdp.setGoneCallback(data => {
            console.log('ssdp - gone:', data);
            const devices = this.devices.getValue();
            devices.delete(data.usn);
            this.devices.next(devices);
        });
    }

    async startAdvertising(port: number) {
        console.log('ssdp - startAdvertising');
        if (this.advertising.getValue() !== State.Stopped) {
            return;
        }

        this.advertising.next(State.Starting);
        try {
            await cordova.plugins.ssdp.startAdvertising(this.target, port);
            this.advertising.next(State.Started);
        } catch (e) {
            this.advertising.next(State.Stopped);
            throw e;
        }
    }

    async stop() {
        console.log('ssdp - stop');
        if (this.advertising.getValue() === State.Started) {
            this.advertising.next(State.Stopping);
            try {
                await cordova.plugins.ssdp.stop();
                this.advertising.next(State.Stopped);
            } catch (e) {
                this.advertising.next(State.Started);
                throw e;
            }
        }

        if (this.discovering.getValue() === State.Started) {
            this.discovering.next(State.Stopping);
            try {
                await cordova.plugins.ssdp.stop();
                this.discovering.next(State.Stopped);
            } catch (e) {
                this.discovering.next(State.Started);
                throw e;
            }
        }
    }

    async searchDevices() {
        console.log('ssdp - searchDevices');
        if (this.discovering.getValue() !== State.Stopped) {
            return;
        }

        this.discovering.next(State.Starting);
        try {
            cordova.plugins.ssdp.startSearching(this.target);
            this.discovering.next(State.Started);
        } catch (e) {
            this.discovering.next(State.Stopped);
            throw e;
        }
    }

    reset() {
        this.devices.next(new Map<string, Device>());
    }
}