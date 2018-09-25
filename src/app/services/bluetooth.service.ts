import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Device, Provider } from './primitives/device';
import { State } from './primitives/state';

declare const cordova: any;

@Injectable()
export class BluetoothService {
  public discoverable: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public discovering: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());

  constructor() {
    cordova.plugins.bluetooth.setDeviceDiscoveredCallback(data => {
      const devices = this.devices.getValue();
      devices.set(data.address, new Device(
        Provider.Bluetooth,
        data.name,
        data.address, {
          address: data.address,
          paired: data.paired
        }
      ));
      this.devices.next(devices);
    });

    cordova.plugins.bluetooth.setDeviceGoneCallback(data => {
      const devices = this.devices.getValue();
      devices.delete(data.address);
      this.devices.next(devices);
    });
  }

  async enableDiscovery() {
    if (this.discoverable.getValue() !== State.Stopped) {
      return;
    }

    this.discoverable.next(State.Starting);
    try {
      await cordova.plugins.bluetooth.enableDiscovery();
      this.discoverable.next(State.Started);
    } catch (e) {
      this.discoverable.next(State.Stopped);
      throw e;
    }
  }

  async stop() {
    if (this.discovering.getValue() === State.Started) {
      this.discovering.next(State.Stopping);
      try {
        await cordova.plugins.bluetooth.cancelDiscovery();
        this.discovering.next(State.Stopped);
      } catch (e) {
        this.discovering.next(State.Started);
        throw e;
      }
    }
  }

  async searchDevices() {
    if (this.discovering.getValue() !== State.Stopped) {
      return;
    }

    this.discovering.next(State.Starting);
    try {
      cordova.plugins.bluetooth.startDiscovery();
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
