import { Injectable } from '@angular/core';
import { combineLatest, merge, BehaviorSubject } from 'rxjs';
import { toBehaviourSubject } from '../utils/transformers';
import { BluetoothService } from './bluetooth.service';
import { ZeroconfService } from './zeroconf.service';
import { DeviceService, Platform } from './device.service';
import { Device } from './primitives/device';
import { IConnectionProvider , ProviderType } from './interfaces/connection-provider';
import { ConnectionState, State } from './primitives/state';
import { map, mergeMap } from 'rxjs/operators';

export class Provider {
  constructor(
    public provider: ProviderType,
    public name: string,
    public icon: string,
    public custom_icon: string,
    public service: IConnectionProvider
  ) { }
}

function mergeStates(states: [State]): State {
  if (states.some(s => s === State.Started)) {
    return State.Started;
  } else if (states.some(s => s === State.Starting)) {
    return State.Starting;
  } else if (states.some(s => s === State.Stopping)) {
    return State.Stopping;
  } else {
    return State.Stopped;
  }
}

function mergeConnectionStates(states: [ConnectionState]): ConnectionState {
  if (states.some(s => s === ConnectionState.Connected)) {
    return ConnectionState.Connected;
  } else if (states.some(s => s === ConnectionState.Connecting)) {
    return ConnectionState.Connecting;
  } else {
    return ConnectionState.None;
  }
}

@Injectable()
export class ConnectionProviderService implements IConnectionProvider {
  public providers = new BehaviorSubject<Map<ProviderType, Provider>>(new Map<ProviderType, Provider>());

  public deviceState = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.deviceState);
    }),
    mergeMap(states => combineLatest(states)),
    map(mergeStates)
  ), State.Stopped);

  public connectionState = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.connectionState);
    }),
    mergeMap(states => combineLatest(states)),
    map(mergeConnectionStates)
  ), ConnectionState.None);

  public serverState = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.serverState);
    }),
    mergeMap(states => combineLatest(states)),
    map(mergeStates)
  ), State.Stopped);

  public connectableState = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.connectableState);
    }),
    mergeMap(states => combineLatest(states)),
    map(mergeStates)
  ), State.Stopped);

  public listeningState = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.listeningState);
    }),
    mergeMap(states => combineLatest(states)),
    map(mergeStates)
  ), State.Stopped);

  public searchState = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.searchState);
    }),
    mergeMap(states => combineLatest(states)),
    map(mergeStates)
  ), State.Stopped);

  public discoveryState = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.discoveryState);
    }),
    mergeMap(states => combineLatest(states)),
    map(mergeStates)
  ), State.Stopped);

  public devices = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.devices);
    }),
    mergeMap(devices => combineLatest(devices)),
    map(devices => {
      return [].concat.apply([], devices.map(d => Array.from(d.values())));
    })
  ), []);

  public connectedDevice = toBehaviourSubject(this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.connectedDevice);
    }),
    mergeMap(states => combineLatest(states)),
    map(devices => {
      const device = devices.find(d => d !== null);
      return device ? device : null;
    })
  ), null);

  public message = this.providers.pipe(
    map(providers => {
      return Array.from(providers.values()).map(provider => provider.service.message);
    }),
    mergeMap(messageSubjects => merge(... messageSubjects))
  );

  constructor(
    private readonly deviceService: DeviceService,
    private readonly bt: BluetoothService,
    private readonly connectivityService: ZeroconfService
  ) {
    const providers = new Map<ProviderType, Provider>();
    if (this.deviceService.platform !== Platform.IOS) {
      providers.set(
        ProviderType.BLUETOOTH,
        new Provider(
          ProviderType.BLUETOOTH,
          'Bluetooth',
          'bluetooth',
          null,
          this.bt
        )
      );
    }

    providers.set(
      ProviderType.ZEROCONF,
      new Provider(
        ProviderType.ZEROCONF,
        'WiFi',
        'wifi',
        null,
        this.connectivityService
      )
    );

    this.providers.next(providers);
  }

  public async enable() {
    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.deviceState.getValue() !== State.Started
      ).map(
        provider => provider.service.enable()
      )
    );
  }

  public async reset() {
    await Promise.all(
      Array.from(this.providers.getValue().values()).map(
        provider => provider.service.reset()
      )
    );
  }

  public async resetDevices() {
    await Promise.all(
      Array.from(this.providers.getValue().values()).map(
        provider => provider.service.resetDevices()
      )
    );
  }

  public async searchDevices(duration = 10 * 1000) {
    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.deviceState.getValue() === State.Started
      ).map(
        provider => provider.service.searchDevices(duration)
      )
    );
  }

  public async connect(device: Device) {
    if (this.connectionState.getValue() !== ConnectionState.None) {
      console.log('Trying to connect while still connected');
    }

    await this.providers.getValue().get(device.provider).service.connect(device);
  }

  public async disconnect() {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      console.log('Trying to disconnect while not connected');
      return;
    }

    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.connectionState.getValue() === ConnectionState.Connected
      ).map(
        provider => provider.service.disconnect()
      )
    );
  }

  public async send(message: string) {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      console.log('Trying to send while not connected');
    }

    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.connectionState.getValue() === ConnectionState.Connected
      ).map(
        provider => provider.service.send(message)
      )
    );
  }

  public async startServer() {
    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.serverState.getValue() === State.Stopped
      ).map(
        provider => provider.service.startServer()
      )
    );
  }

  public async stopServer() {
    if (this.serverState.getValue() !== State.Started) {
      console.log('Trying to stop listening while not listening');
    }

    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.serverState.getValue() === State.Started
      ).map(
        provider => provider.service.stopServer()
      )
    );
  }

  public async startListening() {
    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.listeningState.getValue() === State.Stopped
      ).map(
        provider => provider.service.startListening()
      )
    );
  }

  public async stopListening() {
    if (this.listeningState.getValue() !== State.Started) {
      console.log('Trying to stop listening while not listening');
    }

    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.listeningState.getValue() === State.Started
      ).map(
        provider => provider.service.stopListening()
      )
    );
  }

  async enableDiscovery() {
    await Promise.all(
      Array.from(this.providers.getValue().values()).filter(
        provider => provider.service.discoveryState.getValue() === State.Stopped
      ).map(
        provider => provider.service.enableDiscovery()
      )
    );
  }
}


