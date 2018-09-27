import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Device, Provider } from './primitives/device';
import { State } from './primitives/state';
import { LoggerService } from './logger.service';
import { DeviceService, Platform } from './device.service';
import { checkPermission, Permission, requestPermission } from '../utils/permissions';

declare const cordova: any;

@Injectable()
export class BluetoothService {
  public supported = new BehaviorSubject<boolean>(false);
  public deviceState = new BehaviorSubject<State>(State.Stopped);
  public hasPermission = new BehaviorSubject<boolean>(false);
  public discoverable: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public discovering: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());

  constructor(private readonly ngZone: NgZone,
              private readonly deviceService: DeviceService) {

    cordova.plugins.bluetooth.getSupported().then(supported => this.ngZone.run(async () => {
      this.supported.next(supported);
    }));

    cordova.plugins.bluetooth.setStateCallback(state => this.ngZone.run(async () => {
      this.deviceState.next(state);
    }));

    cordova.plugins.bluetooth.setDiscoveryCallback(discovering => this.ngZone.run(async () => {
      this.discovering.next(discovering ? State.Started : State.Stopped);
    }));

    cordova.plugins.bluetooth.setDiscoverableCallback(discovery => this.ngZone.run(async () => {
      this.discoverable.next(discovery ? State.Started : State.Stopped);
    }));

    cordova.plugins.bluetooth.getDiscoverable().then(discoverable => this.ngZone.run(() => {
      this.discoverable.next(discoverable ? State.Started : State.Stopped);
    }));

    cordova.plugins.bluetooth.getState().then(state => this.ngZone.run(async () => {
      this.deviceState.next(state);
    }));

    cordova.plugins.bluetooth.setDeviceDiscoveredCallback(data => this.ngZone.run(async () => {
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
    }));

    cordova.plugins.bluetooth.setDeviceGoneCallback(data => this.ngZone.run(async () => {
      const devices = this.devices.getValue();
      devices.delete(data.address);
      this.devices.next(devices);
    }));
  }

  async enableDiscovery() {
    await cordova.plugins.bluetooth.enableDiscovery();
  }

  async stop() {
    if (this.discovering.getValue() !== State.Started) {
      console.log('Trying to start search while not finished');
      return;
    }

      this.discovering.next(State.Stopping);
      try {
        await cordova.plugins.bluetooth.cancelDiscovery();
      } catch (e) {
        this.discovering.next(State.Started);
        throw e;
      }
  }

  async searchDevices() {
    if (this.deviceService.platform !== Platform.Windows && await checkPermission(Permission.CoarseLocation)) {
      if (!this.hasPermission.getValue()) {
        return;
      }

      if (this.discovering.getValue() !== State.Stopped) {
        return;
      }

      if (this.deviceState.getValue() !== State.Started) {
        console.log('Trying to search devices with disabled BT');
        return;
      }

      console.log('Trying to search devices with BT');
      this.discovering.next(State.Starting);
      try {
        cordova.plugins.bluetooth.startDiscovery();
      } catch (e) {
        this.discovering.next(State.Stopped);
        throw e;
      }
    }
  }

  async enable() {
    if (this.deviceState.getValue() !== State.Stopped) {
      console.log('Trying to enable enabled BT');
      return;
    }

    if (this.deviceService.platform === Platform.Android) {
      this.deviceState.next(State.Starting);

      try {
        await cordova.plugins.bluetooth.enable();
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to enable BT', e);
        this.deviceState.next(State.Stopped);
        throw e;
      }
    } else {
      try {
        await cordova.plugins.bluetooth.enable();
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to enable BT', e);
        throw e;
      }
    }
  }

  reset() {
    this.devices.next(new Map<string, Device>());
  }


  async grantPermission() {
    if (this.deviceService.platform !== Platform.Windows && !await checkPermission(Permission.CoarseLocation)) {
      await requestPermission(Permission.CoarseLocation).then(value => this.ngZone.run( () => {
        this.hasPermission.next(value);
        this.searchDevices();
      }));
    } else {
      this.searchDevices();
    }
  }

}
