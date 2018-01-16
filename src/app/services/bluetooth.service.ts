import {EventEmitter, Injectable} from '@angular/core';

declare const cordova: any;
declare const window: any;

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
      } catch (e) {
        window.fabric.Crashlytics.addLog(e);
        window.fabric.Crashlytics.sendNonFatalCrash("Failed to get the list of paired devices");
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
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash("Failed to ensure that bluetooth devices are listening");
    }
  }

  async connect(device) {
    await this.disconnect();

    try {
      await cordova.plugins.bluetooth.connect(device, () => {
        this.onDisconnected.emit();
      });
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash("Failed to connect to the bluetooth device");
    }

    try {
      await cordova.plugins.bluetooth.startReading((message) => {
        this.onMessage.emit(message);
      });
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash("Failed to read from the bluetooth device");
    }
  }

  async disconnect() {
    try {
      if (await cordova.plugins.bluetooth.getConnected()) {
        await cordova.plugins.bluetooth.disconnect();
      }
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash("Failed to disconnect bluetooth devices");
    }
  }

  async send(message) {
    try {
      await cordova.plugins.bluetooth.write(message);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash("Failed to send message to a bluetooth device");
    }
  }

  async openSettings() {
    try {
      return await cordova.plugins.bluetooth.openSettings();
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash("Failed to open bluetooth settings");
    }
  }
}
