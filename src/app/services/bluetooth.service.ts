import { EventEmitter, Injectable } from '@angular/core';

import { LoggerService } from './logger.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const cordova: any;

enum State {
  OFF         = 0x0000000a,
  TURNING_ON  = 0x0000000b,
  ON          = 0x0000000c,
  TURNING_OFF = 0x0000000d
}

@Injectable()
export class BluetoothService {
  enabled = false;

  state: BehaviorSubject<State> = new BehaviorSubject<State>(State.OFF);

  onConnected: EventEmitter<any> = new EventEmitter();
  onDisconnected: EventEmitter<any> = new EventEmitter();
  onDiscoveredDevice: EventEmitter<any> = new EventEmitter();
  onDiscoveryFinished: EventEmitter<any> = new EventEmitter();
  onMessage: EventEmitter<any> = new EventEmitter();

  constructor() {
    this.state.subscribe((state) => {
      console.log('00', state);
    });
    cordova.plugins.bluetooth.setOnState((state) => {
      console.log('11', state);
      this.state.next(state);
    });
    cordova.plugins.bluetooth.getState().then((state) => {
      console.log('22', state);
      this.state.next(state);
    });
    console.log('33', this.state.getValue());
  }

  async ensureEnabled() {
    let enabled = false;
    try {
      enabled = await cordova.plugins.bluetooth.getEnabled();
      if (!enabled) {
        await cordova.plugins.bluetooth.enable();
      }
      this.enabled = true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to enable Bluetooth', e);
      this.enabled = false;
    }

    return this.enabled;
  }

  async getDevices() {
    let devices = [];
    if (this.enabled) {
      try {
        devices = await cordova.plugins.bluetooth.listPairedDevices();
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to get the list of paired devices', e);
      }
    }

    return devices;
  }

  async ensureListening() {
    await this.disconnect();

    try {
      if (!await cordova.plugins.bluetooth.getListening()) {
        await cordova.plugins.bluetooth.startListening(async () => {
          await cordova.plugins.bluetooth.startReading((message) => {
            this.onMessage.emit(message);
          });
          this.onConnected.emit();
        }, () => {
          this.onDisconnected.emit();
        });
      }
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to ensure that bluetooth devices are listening', e);
      return false;
    }

    return true;
  }

  async connect(device) {
    await this.disconnect();

    try {
      await cordova.plugins.bluetooth.connect(device, () => {
        this.onDisconnected.emit();
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to connect to the bluetooth device', e);
      return false;
    }

    try {
      await cordova.plugins.bluetooth.startReading((message) => {
        this.onMessage.emit(message);
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to read from the bluetooth device', e);
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
    return await cordova.plugins.bluetooth.discoverDevices(
      (device) => {
        this.onDiscoveredDevice.emit(device);
      },
      () => {
        this.onDiscoveryFinished.emit();
      }
    );
  }

  async cancelDiscovery() {
    return await cordova.plugins.bluetooth.cancelDiscovery();
  }

  async enableDiscovery() {
    return await cordova.plugins.bluetooth.enableDiscovery();
  }

  async openSettings() {
    try {
      return await cordova.plugins.bluetooth.openSettings();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to open bluetooth settings', e);
      return false;
    }
  }
}
