import {EventEmitter, Injectable, Output} from '@angular/core';

declare const cordova: any;

@Injectable()
export class BluetoothService {
  bt = cordova.plugins.bluetooth;

  enabled = false;

  onConnected: EventEmitter<any> = new EventEmitter();
  onDisconnected: EventEmitter<any> = new EventEmitter();
  onMessage: EventEmitter<any> = new EventEmitter();

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
    if (await this.bt.getConnected()) {
      await this.bt.disconnect();
    }

    if (!await this.bt.getListening()) {
      await this.bt.startListening(async () => {
        await this.bt.startReading((message) => {
          console.log('Message', message);
        });
        if (this.onConnected) {
          this.onConnected.emit();
        }
      }, () => {
        if (this.onDisconnected) {
          this.onDisconnected.emit();
        }
      });
    }
  }

  async connect(device) {
    if (await this.bt.getConnected()) {
      await this.bt.disconnect();
    }

    await this.bt.connect(device, () => {
      if (this.onDisconnected) {
        this.onDisconnected.emit();
      }
    });

    await this.bt.startReading((message) => {
      if (this.onMessage) {
        this.onMessage.emit(message);
      }
    });
  }

  async send(message) {
    this.bt.send(message);
  }
}
