import { EventEmitter, Injectable } from '@angular/core';

import { LoggerService } from './logger.service';

declare const cordova: any;

@Injectable()
export class BluetoothService {
  enabled = false;

  onConnected: EventEmitter<any> = new EventEmitter();
  onDisconnected: EventEmitter<any> = new EventEmitter();
  onMessage: EventEmitter<any> = new EventEmitter();

  constructor() {}

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

  async openSettings() {
    try {
      return await cordova.plugins.bluetooth.openSettings();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to open bluetooth settings', e);
      return false;
    }
  }
}
