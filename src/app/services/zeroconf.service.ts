import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, interval, merge, Subject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { toBehaviourSubject, toReplaySubject, waitForSubject } from '../utils/transformers';
import { DeviceService } from './device.service';
import { DiscoveryService } from './discovery.service';
import { IConnectionProvider } from './interfaces/connection-provider';
import { Device } from './primitives/device';
import { ConnectionState, State } from './primitives/state';
import { SocketClientService } from './socketclient.service';
import { SocketServerService } from './socketserver.service';
import { distinctUntilChanged, skip } from 'rxjs/internal/operators';

declare const cordova;
declare const navigator;

@Injectable()
export class ZeroconfService implements IConnectionProvider {
  public supported = new BehaviorSubject<boolean>(true);

  public deviceState = new BehaviorSubject<State>(State.Stopped);

  public connectionState = toBehaviourSubject(
    combineLatest([
      this.socketClientService.state,
      this.socketServerService.connectionState
    ], (clientState, serverState) => {
      if ([clientState, serverState].some(v => v === ConnectionState.Connected)) {
        return ConnectionState.Connected;
      } else if ([clientState, serverState].some(v => v === ConnectionState.Connecting)) {
        return ConnectionState.Connecting;
      } else {
        return ConnectionState.None;
      }
    }),
    ConnectionState.None
  );

  public serverState = this.socketServerService.state;
  public listeningState = this.discoveryService.advertising;

  public connectableState = toBehaviourSubject(
    combineLatest([
      this.listeningState,
      this.serverState
    ], (discoveryState, serverState) => {
      if (discoveryState === serverState) {
        return serverState;
      } else if ([discoveryState, serverState].some(v => v === State.Starting)) {
        return State.Starting;
      } else if ([discoveryState, serverState].some(v => v === State.Stopping)) {
        return State.Stopping;
      } else {
        return State.Starting;
      }
    }),
    State.Stopped
  );

  public searchState = this.discoveryService.discovering;
  public discoveryState = this.discoveryService.advertising;

  public devices = this.discoveryService.devices;

  public connectedDevice = toBehaviourSubject(combineLatest([
    this.socketServerService.connectedDevice,
    this.socketClientService.connectedDevice
  ]).pipe(
    map(([serverDevice, clientDevice]) => {
      // Just for the case of unambiguity we prefer the client
      if (clientDevice !== null) {
        return clientDevice;
      } else {
        return serverDevice;
      }
    })
  ), null);

  public message = toReplaySubject(merge(
    this.socketClientService.message,
    // in order to prevent a mess we ignore messages to the server while the client is connected
    this.socketServerService.message.pipe(filter(_ => this.socketClientService.state.getValue() !== ConnectionState.Connected))
  ), 1);

  private refreshTimer = interval(500);

  public serverStateScheduled = new BehaviorSubject<boolean>(false);
  public listeningStateScheduled = new BehaviorSubject<boolean>(false);
  public connectableStateScheduled = toBehaviourSubject(combineLatest([
    this.serverStateScheduled,
    this.listeningStateScheduled
  ]).pipe(
    map(([serverStateScheduled, listeningStateScheduled]) => {
      return serverStateScheduled || listeningStateScheduled;
    })
  ), false);

  private interruptServerSubject = new Subject<any>();
  private interruptListeningSubject = new Subject<any>();

  constructor(
    private readonly socketClientService: SocketClientService,
    private readonly socketServerService: SocketServerService,
    private readonly discoveryService: DiscoveryService,
    private readonly deviceService: DeviceService
  ) {
    this.deviceService.deviceReady().then(() => {
      this.refreshTimer.subscribe(async () => {
        try {
          if (await this.checkWiFiState()) {
            if (navigator.connection.type === 'wifi') {
              this.deviceState.next(State.Started);
            } else {
              this.deviceState.next(State.Starting);
            }
          } else {
            this.deviceState.next(State.Stopped);
          }
        } catch (error) {
          console.error('The following error occurred: ' + error);
          this.deviceState.next(State.Stopped);
        }
      });
    });

    this.deviceState.pipe(
      distinctUntilChanged(),
      skip(1)
    ).subscribe(async () => await this.discoveryService.reset());
  }

  public async reset() {
    await this.stopListening();
    await this.disconnect();
    await this.stopServer();
  }

  public async startServer() {
    // Cancel any scheduled state change
    console.log('Socket server start was requested, interrupting other actions');

    this.interruptServerSubject.next();

    switch (this.serverState.getValue()) {
      case State.Stopped:
        console.log('Starting socket server from stopped state');
        await this.socketServerService.start();
        break;
      case State.Stopping:
        console.log('Starting socket server from stopping state, waiting for being stopped');
        this.serverStateScheduled.next(true);
        if (await waitForSubject(this.serverState, State.Stopped, this.interruptServerSubject)) {
          console.log('Starting socket server after it has been stopped (awaited)');
          await this.socketServerService.start();
        } else {
          console.log('Scheduled socket server start was canceled');
        }
        this.serverStateScheduled.next(false);
        break;
      case State.Starting:
        console.log('Starting socket server from starting state, perform no actions');
        break;
      case State.Started:
        console.log('Socket server is already started');
        break;
    }
  }

  public async stopServer() {
    // Cancel any scheduled state change
    console.log('Socket server stop was requested, interrupting other actions');

    this.interruptServerSubject.next();

    switch (this.serverState.getValue()) {
      case State.Started:
        console.log('Stopping socket server from started state');
        await this.socketServerService.stop();
        break;
      case State.Starting:
        console.log('Stopping socket server from starting state, waiting for being started');
        this.serverStateScheduled.next(true);
        if (await waitForSubject(this.serverState, State.Started, this.interruptServerSubject)) {
          console.log('Stopping socket server after it has been started (awaited)');
          await this.socketServerService.stop();
        } else {
          console.log('Scheduled socket server stop was canceled');
        }
        this.serverStateScheduled.next(false);
        break;
      case State.Stopping:
        console.log('Stopping socket server from sopping state, perform no actions');
        break;
      case State.Stopped:
        console.log('Socket server is already stopped');
        break;
    }
  }

  public async startListening() {
    // Cancel any scheduled state change
    console.log('Listening start was requested, interrupting other actions');

    this.interruptListeningSubject.next();

    switch (this.listeningState.getValue()) {
      case State.Stopped:
        console.log('Starting listening from stopped state');
        await this.discoveryService.startAdvertising(await this.socketServerService.getIpv4Address(), this.socketServerService.port);
        break;
      case State.Stopping:
        console.log('Starting listening from stopping state, waiting for being stopped');
        this.listeningStateScheduled.next(true);
        if (await waitForSubject(this.listeningState, State.Stopped, this.interruptListeningSubject)) {
          console.log('Starting listening after it has been stopped (awaited)');
          await this.discoveryService.startAdvertising(await this.socketServerService.getIpv4Address(), this.socketServerService.port);
        } else {
          console.log('Scheduled listening start was canceled');
        }
        this.listeningStateScheduled.next(false);
        break;
      case State.Starting:
        console.log('Starting listening from starting state, perform no actions');
        break;
      case State.Started:
        console.log('Listening is already started');
        break;
    }
  }

  public async stopListening() {
    // Cancel any scheduled state change
    console.log('Listening stop was requested, interrupting other actions');

    this.interruptListeningSubject.next();

    switch (this.listeningState.getValue()) {
      case State.Started:
        console.log('Stopping listening from started state');
        await this.discoveryService.stopAdvertising();
        break;
      case State.Starting:
        console.log('Stopping listening from starting state, waiting for being started');
        this.listeningStateScheduled.next(true);
        if (await waitForSubject(this.listeningState, State.Started, this.interruptListeningSubject)) {
          console.log('Stopping socket server after it has been started (awaited)');
          await this.discoveryService.stopAdvertising();
        } else {
          console.log('Scheduled listening stop was canceled');
        }
        this.listeningStateScheduled.next(false);
        break;
      case State.Stopping:
        console.log('Stopping listening from sopping state, perform no actions');
        break;
      case State.Stopped:
        console.log('Listening is already stopped');
        break;
    }
  }

  // Client interface

  public async resetDevices() {
    await this.discoveryService.resetDevices();
  }

  public async searchDevices(duration: number) {
    await this.discoveryService.searchDevices(duration);
  }

  public async cancelSearch() {
    await this.discoveryService.cancelSearch();
  }

  public async connect(device: Device) {
    if (device.ip != null) {
      await this.socketClientService.connect(device);
    }
  }

  // Mixed interface

  public disconnect(): void {
    // we assume that services perform noop if not connected
    this.socketClientService.disconnect();
    this.socketServerService.disconnect();
  }

  public refreshConnection() {
    if (this.socketServerService.connectionState.getValue() === ConnectionState.Connected) {
      this.socketServerService.refreshConnection();
    } else {
      this.socketClientService.refreshConnection();
    }
  }

  public send(message: string) {
    // in order to prevent a mess we always send messages to the server if it's connected
    if (this.socketServerService.connectionState.getValue() === ConnectionState.Connected) {
      this.socketServerService.send(message);
    } else {
      this.socketClientService.send(message);
    }
  }

  public async enable() {
    await this.setWiFiState(true);
  }

  async cancelDiscovery() {}

  async enableDiscovery() {}

  private async checkWiFiState() {
    return await new Promise<boolean>((resolve, reject) => {
      cordova.plugins.diagnostic.isWifiAvailable(
        available => resolve(available as boolean),
        reject
      );
    });
  }

  private async setWiFiState(state: boolean) {
    return await new Promise<any>((resolve, reject) => {
      cordova.plugins.diagnostic.setWifiState(
        resolve,
        reject,
        state
      );
    });
  }
}
