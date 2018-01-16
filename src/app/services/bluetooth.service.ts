import {EventEmitter, Injectable} from '@angular/core';

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
      this.enabled = false;
    }

    return this.enabled;
  }

  async getDevices() {
    let devices = [];
    if (this.enabled) {
      try {
        devices = await cordova.plugins.bluetooth.listPairedDevices();
      } catch (e) {}
    }

    return devices;
  }

  async ensureListening() {
    if (await cordova.plugins.bluetooth.getConnected()) {
      await cordova.plugins.bluetooth.disconnect();
    }

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
  }

  async connect(device) {
    if (await cordova.plugins.bluetooth.getConnected()) {
      await cordova.plugins.bluetooth.disconnect();
    }

    await cordova.plugins.bluetooth.connect(device, () => {
      this.onDisconnected.emit();
    });

    await cordova.plugins.bluetooth.startReading((message) => {
      this.onMessage.emit(message);
    });
  }

  async disconnect() {
    if (await cordova.plugins.bluetooth.getConnected()) {
      await cordova.plugins.bluetooth.disconnect();
    }
  }


  async send(message) {
    await cordova.plugins.bluetooth.write(message);
  }

  async openSettings() {
    return await cordova.plugins.bluetooth.openSettings();
  }
}
