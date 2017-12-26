import { Injectable } from '@angular/core';

declare var cordova: any;

@Injectable()
export class BluetoothService {
  bt = cordova.plugins.bluetooth;

  enabled = false;

  onConnected = null;
  onDisconnected = null;

  constructor() {}

  async ensureEnabled() {
    let enabled = false;
    try {
      enabled = await this.bt.getEnabled();
      if (!enabled) {
        await this.bt.enable();
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
        devices = await this.bt.listPairedDevices();
      } catch (e) {}
    }

    return devices;
  }

  async ensureListening() {
    try {
      await this.bt.disconnect();
    } catch (e) {}

    await this.bt.startListening(async () => {
      await this.bt.startReading((message) => {
        console.log('Message', message);
      });
      if (this.onConnected) {
        this.onConnected();
      }
    }, () => {
      if (this.onDisconnected) {
        this.onDisconnected();
      }
    });
  }

  async connect(device) {
    try {
      await this.bt.disconnect();
    } catch (e) {}

    await this.bt.connect(device, () => {
      if (this.onDisconnected) {
        this.onDisconnected();
      }
    });
    await this.bt.startReading((message) => {
      console.log('Message', message);
    });
  }

  async send(message) {
    try {
      this.bt.send(message);
    } catch (e) {
      console.log('Send erroe:', e);
    }
  }
}
