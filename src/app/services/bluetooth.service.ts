import { Injectable, NgZone } from '@angular/core';




import { BehaviorSubject ,  Observable ,  combineLatest ,  Subject } from 'rxjs';

import { LoggerService } from './logger.service';

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

  public enabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public enabledChanged: Observable<boolean> = this.enabled.skip(1).distinctUntilChanged();
  public enabledEvent: Observable<any> = this.enabledChanged.filter(enabled => enabled).mapTo(null);
  public disabledEvent: Observable<any> = this.enabledChanged.filter(enabled => !enabled).mapTo(null);
  public connected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public connectedChanged: Observable<boolean> = this.connected.skip(1).distinctUntilChanged();
  public connectedEvent: Observable<any> = this.connectedChanged.filter(connected => connected).mapTo(null);
  public disconnectedEvent: Observable<any> = this.connectedChanged.filter(connected => !connected).mapTo(null);
  public discovering: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public discoveringChanged: Observable<boolean> = this.discovering.skip(1).distinctUntilChanged();
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.filter(discovering => discovering).mapTo(null);
  public discoveryFinishedEvent: Observable<any> = this.discoveringChanged.filter(discovering => !discovering).mapTo(null);
  private deviceRelatedChange = combineLatest(
    this.enabled.filter(enabled => enabled),
    this.connected,
    this.discovering
  );
  public discoverable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public discoverableChanged: Observable<boolean> = this.discoverable.skip(1).distinctUntilChanged();
  public discoverableStartedEvent: Observable<any> = this.discoverableChanged.filter(discoverable => discoverable).mapTo(null);
  public discoverableFinishedEvent: Observable<any> = this.discoverableChanged.filter(discoverable => !discoverable).mapTo(null);
  public connectedDevice: BehaviorSubject<Device> = new BehaviorSubject<Device>(null);
  public connectedDeviceChanged: Observable<Device> = this.connectedDevice.skip(1)
    .distinctUntilChanged((x, y) => x.name === y.name && x.address === y.address);
  public pairedDevices: BehaviorSubject<Array<Device>> = new BehaviorSubject<Array<Device>>([]);
  public pairedDevicesChanged: Observable<Array<Device>> = this.pairedDevices.skip(1)
    .distinctUntilChanged((x, y) =>
      x.length === y.length &&
      x.reduce((s, xi, i) => xi.name === y[i].name && xi.address === y[i].address && s, true));
  public discoveredDevices: BehaviorSubject<Array<Device>> = new BehaviorSubject<Array<Device>>([]);
  public discoveredDevicesChanged: Observable<Array<Device>> = this.discoveredDevices.skip(1)
    .distinctUntilChanged((x, y) =>
      x.length === y.length &&
      x.reduce((s, xi, i) => xi.name === y[i].name && xi.address === y[i].address && s, true));
  public message: Subject<string> = new Subject<string>();

  constructor(private ngZone: NgZone) {
    this.state.subscribe(state => this.enabled.next(state === State.ON));
    this.connectedDevice.subscribe(device => this.connected.next(device !== null));

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
      this.discoveredDevices.next(this.discoveredDevices.getValue().concat([Device.fromJSON(device)]));
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

  async requestEnable() {
    try {
      if (!this.enabled.getValue()) {
        await cordova.plugins.bluetooth.enable();
      }
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to enable Bluetooth', e);
    }
  }

  async ensureListening() {
    await this.disconnect();

    try {
      if (!await cordova.plugins.bluetooth.getListening()) {
        await cordova.plugins.bluetooth.startListening();
      }
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to ensure that bluetooth devices are listening', e);
      return false;
    }

    return true;
  }

  async connect(device: Device) {
    await this.disconnect();

    try {
      await cordova.plugins.bluetooth.connect(device.toJSON());
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to connect to the bluetooth device', e);
      return false;
    }

    return true;
  }

  async disconnect() {
    try {
      if (await cordova.plugins.bluetooth.getConnected()) {
        await cordova.plugins.bluetooth.disconnect();
      }
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to disconnect bluetooth devices', e);
      return false;
    }

    return true;
  }

  async send(message) {
    try {
      await cordova.plugins.bluetooth.write(message);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to send message to a bluetooth device', e);
      return false;
    }

    return true;
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

  async stopListening() {
    await cordova.plugins.bluetooth.stopListening();
  }
}
