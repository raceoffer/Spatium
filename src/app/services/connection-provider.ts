import { Injectable } from '@angular/core';
import { combineLatest, merge } from 'rxjs';
import { toBehaviourSubject, toReplaySubject } from '../utils/transformers';
import { BluetoothService } from './bluetooth.service';
import { ConnectivityService } from './connectivity.service';
import { Device } from './primitives/device';

export enum ProviderType {
  BLUETOOTH,
  ZEROCONF
}

export class Provider {
  constructor(public provider: ProviderType,
              public icon: string,
              public custom_icon: string,
              public enable_srting: string,
              public service: any) { }
}

@Injectable()
export class ConnectionProviderService {

  public providers: Map<ProviderType, Provider> = new Map<ProviderType, Provider>();

  public connectedEvent = merge(this.bt.connectedEvent, this.connectivityService.connectedEvent);
  public disconnectedEvent = merge(this.bt.disconnectedEvent, this.connectivityService.disconnectedEvent);
  public connected = toBehaviourSubject(combineLatest(
    [
      this.bt.connected, this.connectivityService.connected
    ], (bt, zeroconf) => {
      return bt || zeroconf;
    }), false);

  public discovering = toBehaviourSubject(combineLatest(
    [
      this.bt.discovering, this.connectivityService.discovering
    ], (bt, zeroconf) => {
      return bt || zeroconf;
    }), false);

  public combinedDevices = toBehaviourSubject(combineLatest(
    [
      this.bt.devices, this.connectivityService.devices
    ], (bt, zeroconf) => {
      const btArray = Array.from<any>(bt.values());
      const zeroconfArray = Array.from<any>(zeroconf.values());
      return btArray.concat(zeroconfArray);
    }), null);

  public listening = toBehaviourSubject(combineLatest(
    [
      this.bt.listening, this.connectivityService.listening
    ], (bt, zeroconf) => {
      return bt || zeroconf;
    }), false);

  public message = toReplaySubject(merge(this.bt.message, this.connectivityService.message), 1);

  constructor(private readonly bt: BluetoothService,
              private readonly connectivityService: ConnectivityService) {
    this.providers.set(ProviderType.BLUETOOTH, new Provider(ProviderType.BLUETOOTH, 'bluetooth', null, 'Bluetooth synchronization', this.bt));
    this.providers.set(ProviderType.ZEROCONF, new Provider(ProviderType.ZEROCONF, null, 'icon-custom-bonjour_black', 'WiFi/LAN synchronization', this.connectivityService));
  }

  async searchDevices() {
    const duration = 5 * 1000;
    this.providers.forEach((value: Provider, key: ProviderType) => {
      value.service.searchDevices(duration);
    });
  }

  async connect(device: Device) {
    console.log('connect');
    switch (device.provider) {
      case ProviderType.BLUETOOTH: {
        if (device.macAddress != null) {
          await this.providers.get(device.provider).service.connect(device);
        }
        break;
      }
      case ProviderType.ZEROCONF: {
        if (device.ip != null) {
          await this.providers.get(device.provider).service.connect(device.ip);
        }
        break;
      }
    }
  }

  async disconnect() {
    console.log('disconnect');
    this.providers.forEach((value: Provider, key: ProviderType) => {
      if (value.service.connected.value) {
        value.service.disconnect();
      }
    });
  }

  public send(message: any): void {
    console.log('send');
    this.providers.forEach((value: Provider, key: ProviderType) => {
      try {
        console.log(value.service);
        if (value.service.connected.value) {
          console.log(message);
          value.service.send(message);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  public startListening(): void {
    this.providers.forEach((value: Provider, key: ProviderType) => {
      value.service.startListening();
    });
  }

  public stopListening(): void {
    this.providers.forEach((value: Provider, key: ProviderType) => {
      value.service.stopListening();
    });
  }

  async enableProvider(providerType: ProviderType) {
    try {
      await this.providers.get(providerType).service.requestEnable();
    } catch (e) {
      console.error(e);
    }
  }

  async enableDiscoverable(providerType: ProviderType) {
    try {
      await this.providers.get(providerType).service.enableDiscoverable();
    } catch (e) {
      console.error(e);
    }
  }

}


