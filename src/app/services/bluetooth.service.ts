import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { skip, filter, distinctUntilChanged, mapTo, map } from 'rxjs/operators';

import { LoggerService } from './logger.service';
import { DeviceService } from './device.service';
import { toBehaviourSubject } from "../utils/transformers";

import { Device, equals } from "./primitives/device";
import { ConnectionState, State } from "./primitives/state";

declare const cordova: any;

@Injectable()
export class BluetoothService {
  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public enabled: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === State.Started)), false);
  public enabledChanged: Observable<boolean> = this.enabled.pipe(distinctUntilChanged(), skip(1));
  public enabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => enabled), mapTo(null));
  public disabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => !enabled), mapTo(null));

  public connectionState: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(ConnectionState.None);
  public connectionStateChanged: Observable<ConnectionState> = this.connectionState.pipe(distinctUntilChanged(), skip(1));

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.connectionState.pipe(map(state => state === ConnectionState.Connected)), false);
  public connectedChanged: Observable<boolean> = this.connected.pipe(distinctUntilChanged(), skip(1));
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));

  public listeningState: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public listening: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Started)), false);
  public listeningChanged: Observable<boolean> = this.listening.pipe(distinctUntilChanged(), skip(1));
  public listeningStartedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => listening), mapTo(null));
  public listeningSoppedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => !listening), mapTo(null));

  public discoveryState: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public discovering: BehaviorSubject<boolean> = toBehaviourSubject(this.discoveryState.pipe(map(state => state === State.Started)), false);
  public discoveringChanged: Observable<boolean> = this.discovering.pipe(distinctUntilChanged(), skip(1));
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => discovering), mapTo(null));
  public discoveryFinishedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => !discovering), mapTo(null));

  public discoverableState: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public discoverable: BehaviorSubject<boolean> = toBehaviourSubject(this.discoverableState.pipe(map(state => state === State.Started)), false);
  public discoverableChanged: Observable<boolean> = this.discoverable.pipe(distinctUntilChanged(), skip(1));
  public discoverableStartedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => discoverable), mapTo(null));
  public discoverableFinishedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => !discoverable), mapTo(null));

  public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());
  public devicesChanged: Observable<Map<string, Device>> = this.devices.pipe(
    distinctUntilChanged(equals),
    skip(1));

  public message: Subject<any> = new Subject<any>();

  static mapState(internalState: number): State {
    switch (internalState) {
      case 0x0000000a:
        return State.Stopped;
      case 0x0000000b:
        return State.Starting;
      case 0x0000000c:
        return State.Started;
      case 0x0000000d:
        return State.Stopping;
    }
  }

  constructor(
    private readonly deviceService: DeviceService,
    private readonly ngZone: NgZone
  ) {
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();

    cordova.plugins.bluetooth.setConnectedCallback(device => this.ngZone.run(async () => {
      this.connectionState.next(device ? ConnectionState.Connected : ConnectionState.None);
      if (device) {
        await cordova.plugins.bluetooth.startReading();
      }
    }));

    cordova.plugins.bluetooth.setDiscoveredCallback(device => this.ngZone.run(() => {
      const devices = this.devices.getValue();
      if (devices.has(device.name)) {
        if (devices.get(device.name).macAddress === device.address) {
          return;
        }
      }

      devices.set(device.name, new Device(device.name, device.address));
      this.devices.next(devices);
    }));

    cordova.plugins.bluetooth.setDiscoveryCallback(discovery => this.ngZone.run(() => {
      this.discoveryState.next(discovery ? State.Started : State.Stopped);
    }));

    cordova.plugins.bluetooth.setMessageCallback(message => this.ngZone.run(() => {
      this.message.next(JSON.parse(message));
    }));

    cordova.plugins.bluetooth.setDiscoverableCallback(discoverable => this.ngZone.run(() => {
      this.discoverableState.next(discoverable ? State.Started : State.Stopped);
    }));

    cordova.plugins.bluetooth.setStateCallback(state => this.ngZone.run(() => {
      this.state.next(BluetoothService.mapState(state));
    }));

    cordova.plugins.bluetooth.getState().then(state => this.ngZone.run(() => {
      this.state.next(BluetoothService.mapState(state));
    }));

    cordova.plugins.bluetooth.getDiscoverable().then(discoverable => this.ngZone.run(() => {
      this.discoverableState.next(discoverable ? State.Started : State.Stopped);
    }));
  }

  async requestEnable() {
    if (this.state.getValue() !== State.Stopped) {
      return;
    }

    try {
      await cordova.plugins.bluetooth.enable();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start listening', e);
      throw e;
    }
  }

  async startListening() {
    if (this.listeningState.getValue() !== State.Stopped) {
      return;
    }

    this.listeningState.next(State.Starting);

    try {
      await cordova.plugins.bluetooth.startListening();
      this.listeningState.next(State.Started);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start listening', e);
      this.listeningState.next(State.Stopped);
      throw e;
    }
  }

  async stopListening() {
    if (this.listeningState.getValue() !== State.Started) {
      return;
    }

    this.listeningState.next(State.Stopping);

    try {
      await cordova.plugins.bluetooth.stopListening();
      this.listeningState.next(State.Stopped);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start listening', e);
      this.listeningState.next(State.Started);
      throw e;
    }
  }

  async connect(device: Device) {
    if (this.connectionState.getValue() !== ConnectionState.None) {
      return;
    }

    this.connectionState.next(ConnectionState.Connecting);

    try {
      await cordova.plugins.bluetooth.connect({name: device.name, address: device.macAddress});
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to connect', e);
      this.connectionState.next(ConnectionState.None);
      throw e;
    }
  }

  async disconnect() {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      return;
    }

    try {
      await cordova.plugins.bluetooth.disconnect();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to disconnect bluetooth devices', e);
      throw e;
    }
  }

  async send(message: any) {
    try {
      await cordova.plugins.bluetooth.write(JSON.stringify(message));
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to send message to a bluetooth device', e);
      throw e;
    }
  }

  async startDiscovery() {
    if (this.discoveryState.getValue() !== State.Stopped) {
      return;
    }

    this.discoveryState.next(State.Starting);

    const paired = await cordova.plugins.bluetooth.getPairedDevices();
    const map = new Map<string, Device>();
    for (const device of paired) {
      if (device.hasOwnProperty('name')) {
        map.set(device.name, new Device(device.name, device.address, null, true));
      }
    }

    this.devices.next(map);

    try {
      await cordova.plugins.bluetooth.startDiscovery();
    } catch(e) {
      LoggerService.nonFatalCrash('Failed to start discovery', e);
      this.discoveryState.next(State.Stopped);
      throw e;
    }
  }

  async cancelDiscovery() {
    if (this.discoveryState.getValue() !== State.Started) {
      return;
    }

    this.discoveryState.next(State.Stopping);

    try {
      await cordova.plugins.bluetooth.cancelDiscovery();
    } catch(e) {
      LoggerService.nonFatalCrash('Failed to stop discovery', e);
      this.discoveryState.next(State.Started);
      throw e;
    }
  }

  async enableDiscovery() {
    if (this.discoverableState.getValue() !== State.Stopped) {
      return;
    }

    this.discoverableState.next(State.Starting);

    try {
      await cordova.plugins.bluetooth.enableDiscovery();
    } catch(e) {
      LoggerService.nonFatalCrash('Failed to enable discovery', e);
      this.discoverableState.next(State.Stopped);
      throw e;
    }
  }
}
