import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { skip, filter, distinctUntilChanged, mapTo, map } from 'rxjs/operators';

import { LoggerService } from './logger.service';
import { DeviceService } from './device.service';
import { toBehaviourSubject } from "../utils/transformers";

declare const cordova: any;

enum State {
  OFF = 0x0000000a,
  TURNING_ON = 0x0000000b,
  ON = 0x0000000c,
  TURNING_OFF = 0x0000000d
}

export class Device {
  constructor(public name: string, public address: string) { }

  static fromJSON(json): Device {
    return new Device(json.name, json.address);
  }

  toJSON(): any {
    return {name: this.name, address: this.address};
  }
}

@Injectable()
export class BluetoothService {
  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.OFF);

  public enabled: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === State.ON)), false);
  public enabledChanged: Observable<boolean> = this.enabled.pipe(distinctUntilChanged(), skip(1));
  public enabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => enabled), mapTo(null));
  public disabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => !enabled), mapTo(null));

  public connectedDevice: BehaviorSubject<Device> = new BehaviorSubject<Device>(null);
  public connectedDeviceChanged: Observable<Device> = this.connectedDevice.pipe(
    distinctUntilChanged((x, y) => x.name === y.name && x.address === y.address),
    skip(1));

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.connectedDevice.pipe(map(device => device !== null)), false);
  public connectedChanged: Observable<boolean> = this.connected.pipe(distinctUntilChanged(), skip(1));
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));

  public discovering: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public discoveringChanged: Observable<boolean> = this.discovering.pipe(distinctUntilChanged(), skip(1));
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => discovering), mapTo(null));
  public discoveryFinishedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => !discovering), mapTo(null));

  public discoverable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public discoverableChanged: Observable<boolean> = this.discoverable.pipe(distinctUntilChanged(), skip(1));
  public discoverableStartedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => discoverable), mapTo(null));
  public discoverableFinishedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => !discoverable), mapTo(null));

  public pairedDevices: BehaviorSubject<Array<Device>> = new BehaviorSubject<Array<Device>>([]);
  public pairedDevicesChanged: Observable<Array<Device>> = this.pairedDevices.pipe(
    distinctUntilChanged((x, y) =>
      x.length === y.length &&
      x.reduce((s, xi, i) => xi.name === y[i].name && xi.address === y[i].address && s, true)),
    skip(1));

  public discoveredDevices: BehaviorSubject<Array<Device>> = new BehaviorSubject<Array<Device>>([]);
  public discoveredDevicesChanged: Observable<Array<Device>> = this.discoveredDevices.pipe(
    distinctUntilChanged((x, y) =>
      x.length === y.length &&
      x.reduce((s, xi, i) => xi.name === y[i].name && xi.address === y[i].address && s, true)),
    skip(1));

  public message: Subject<string> = new Subject<string>();

  private refreshDevicesEvent = new Subject<any>();

  private deviceRelatedChange = merge(
    this.refreshDevicesEvent,
    this.enabled.pipe(filter(enabled => enabled)),
    this.connected,
    this.discovering
  );

  constructor(
    private readonly deviceService: DeviceService,
    private readonly ngZone: NgZone
  ) {
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();

    this.deviceRelatedChange.subscribe(() => this.ngZone.run(async () => {
      const devices = await cordova.plugins.bluetooth.listPairedDevices();
      this.pairedDevices.next(devices.map((device => Device.fromJSON(device))));
    }));

    this.discoveryStartedEvent.subscribe(() => this.discoveredDevices.next([]));

    cordova.plugins.bluetooth.setConnectedCallback((device) => this.ngZone.run(async () => {
      this.connectedDevice.next(device ? Device.fromJSON(device) : null);
      await cordova.plugins.bluetooth.startReading();
    }));

    cordova.plugins.bluetooth.setDiscoveredCallback((device) => this.ngZone.run(() => {
      let devices = this.discoveredDevices.getValue();
      const index = devices.map(function(item) { return item.address; }).indexOf(device.address);
      if(index == -1) {
        devices = devices.concat(Device.fromJSON(device));
      } else {
        devices[index].name = device.name;
      }
      this.discoveredDevices.next(devices);
    }));

    cordova.plugins.bluetooth.setDiscoveryCallback((discovery) => this.ngZone.run(() => {
      this.discovering.next(discovery);
    }));

    cordova.plugins.bluetooth.setMessageCallback((message) => this.ngZone.run(() => {
      this.message.next(message);
    }));

    cordova.plugins.bluetooth.setDiscoverableCallback((discoverable) => this.ngZone.run(() => {
      this.discoverable.next(discoverable);
    }));

    cordova.plugins.bluetooth.getDiscoverable().then((discoverable) => this.ngZone.run(() => {
      this.discoverable.next(discoverable);
    }));

    cordova.plugins.bluetooth.setStateCallback((state) => this.ngZone.run(() => {
      this.state.next(state);
    }));

    cordova.plugins.bluetooth.getState().then((state) => this.ngZone.run(() => {
      this.state.next(state);
    }));
  }

  public refreshDevices() {
    this.refreshDevicesEvent.next();
  }

  async requestEnable() {
    try {
      if (this.enabled.getValue()) {
        return false;
      }

      await cordova.plugins.bluetooth.enable();

      return true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to enable Bluetooth', e);
      return false;
    }
  }

  async ensureListening() {
    await this.disconnect();

    try {
      if (await cordova.plugins.bluetooth.getListening()) {
        return false;
      }

      await cordova.plugins.bluetooth.startListening();

      return true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to ensure that bluetooth devices are listening', e);
      return false;
    }
  }

  async stopListening() {
    try {
      if (!await cordova.plugins.bluetooth.getListening()) {
        return false;
      }
      await cordova.plugins.bluetooth.stopListening();
      return true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to stop listening', e);
      return false;
    }
  }

  async connect(device: Device) {
    await this.disconnect();

    try {
      await cordova.plugins.bluetooth.connect(device.toJSON());

      return true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to connect to the bluetooth device', e);
      return false;
    }
  }

  async disconnect() {
    try {
      if (!this.connected.getValue()) {
        return false;
      }

      await cordova.plugins.bluetooth.disconnect();

      return true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to disconnect bluetooth devices', e);
      return false;
    }
  }

  async send(message) {
    try {
      if (!this.connected.getValue()) {
        return false;
      }

      await cordova.plugins.bluetooth.write(message);

      return true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to send message to a bluetooth device', e);
      return false;
    }
  }

  async startDiscovery() {
    await this.cancelDiscovery();
    await cordova.plugins.bluetooth.startDiscovery();
  }

  async cancelDiscovery() {
    await cordova.plugins.bluetooth.cancelDiscovery();
  }

  async enableDiscovery() {
    await cordova.plugins.bluetooth.enableDiscovery();
  }
}
