import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Device, Provider } from './primitives/device';
import { State } from './primitives/state';
import { LoggerService } from './logger.service';
import { DeviceService, Platform } from './device.service';
import { checkPermission, Permission, requestPermission } from '../utils/permissions';
import { toBehaviourSubject } from '../utils/transformers';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { filter, first } from 'rxjs/operators';

declare const cordova: any;

@Injectable()
export class BluetoothService {
  public supported = new BehaviorSubject<boolean>(false);
  public deviceState = new BehaviorSubject<State>(State.Stopped);
  public hasPermission = new BehaviorSubject<boolean>(false);
  public discoverableInner: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public discoverable = toBehaviourSubject(this.discoverableInner.pipe(
    debounceTime(500),
    distinctUntilChanged()
  ), this.discoverableInner.getValue());
  public discoveringInner: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public discovering = toBehaviourSubject(this.discoveringInner.pipe(
    debounceTime(500),
    distinctUntilChanged()
  ), this.discoveringInner.getValue());

  private _ready = new BehaviorSubject<boolean>(false);

  public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());

  constructor(private readonly ngZone: NgZone,
              private readonly deviceService: DeviceService) {

    this.deviceService.deviceReady().then(async () => {

      this.deviceState.next(await cordova.plugins.bluetooth.getState());

      cordova.plugins.bluetooth.getSupported().then(supported => this.ngZone.run(() => {
        this.supported.next(supported);
      }));

      cordova.plugins.bluetooth.setStateCallback(state => this.ngZone.run(() => {
        this.deviceState.next(state);
      }));

      cordova.plugins.bluetooth.setDiscoveryCallback(discovering => this.ngZone.run(() => {
        this.discoveringInner.next(discovering ? State.Started : State.Stopped);
      }));

      cordova.plugins.bluetooth.setDiscoverableCallback(discovery => this.ngZone.run(() => {
        this.discoverableInner.next(discovery ? State.Started : State.Stopped);
      }));

      cordova.plugins.bluetooth.getDiscoverable().then(discoverable => this.ngZone.run(() => {
        this.discoverableInner.next(discoverable ? State.Started : State.Stopped);
      }));

      cordova.plugins.bluetooth.setDeviceDiscoveredCallback(data => this.ngZone.run(() => {
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

      cordova.plugins.bluetooth.setDeviceGoneCallback(data => this.ngZone.run(() => {
        const devices = this.devices.getValue();
        devices.delete(data.address);
        this.devices.next(devices);
      }));

      this._ready.next(true);
    });
  }

  async ready() {
    return await this._ready.pipe(
      filter(ready => !!ready),
      first(),
    ).toPromise();
  }

  async enableDiscovery() {
    await this.ready();
    await cordova.plugins.bluetooth.enableDiscovery();
  }

  async stop() {
    await this.ready();
    if (this.discovering.getValue() !== State.Started) {
      console.log('Trying to start search while not finished');
      return;
    }

    try {
      await cordova.plugins.bluetooth.cancelDiscovery();
    } catch (e) {
      this.discovering.next(State.Started);
      throw e;
    }
  }

  async searchDevices() {
    await this.ready();
    await this.checkPlatformPermission();

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
    try {
      cordova.plugins.bluetooth.startDiscovery();
    } catch (e) {
      this.discovering.next(State.Stopped);
      throw e;
    }
  }

  async enable() {
    await this.ready();
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
    await this.ready();
    await this.checkPlatformPermission();

    if (!this.hasPermission.getValue()) {
      await requestPermission(Permission.CoarseLocation).then(value => this.ngZone.run(() => {
        this.hasPermission.next(value);
        this.searchDevices();
      }));
    } else {
      this.searchDevices();
    }
  }

  async checkPlatformPermission() {
    await this.ready();
    if (this.deviceService.platform !== Platform.Windows) {
      this.hasPermission.next(await checkPermission(Permission.CoarseLocation));
    } else {
      this.hasPermission.next(true);
    }
  }
}
