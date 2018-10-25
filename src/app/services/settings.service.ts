import { Injectable } from '@angular/core';
import { FileService } from './file.service';
import { CurrencyId } from './currencyinfo.service';

import { get, set } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { DeviceService } from './device.service';

@Injectable()
export class SettingsService {
  private readonly settingsFileName = 'settings.json';
  private readonly defaultSettings = {
    presentationViewed: false,
    startPath: null,
    fingerprintEnabled: false,
    currencySettings: {},
    accessWinWebcam: false
  };

  private settings = {};

  private _ready = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly deviceService: DeviceService,
    private readonly fs: FileService
  ) {
    this.deviceService.deviceReady().then(async () => {
      this.settings = await this.getSettings();
      this._ready.next(true);
    });
  }

  public ready() {
    return this._ready.pipe(
      filter(ready => !!ready),
      first(),
    ).toPromise();
  }

  async presentationViewed(): Promise<boolean> {
    return this.getValue('presentationViewed', false);
  }

  async setPresentationViewed(value: boolean) {
    return this.setValue('presentationViewed', value);
  }

  async startPath(): Promise<string | null> {
    return this.getValue('startPath', null);
  }

  async setStartPath(value: string | null) {
    return this.setValue('startPath', value);
  }

  async fingerprintEnabled(): Promise<boolean> {
    return this.getValue('fingerprintEnabled', false);
  }

  async setFingerprintEnabled(value: boolean) {
    return this.setValue('fingerprintEnabled', value);
  }

  async currencySettings(id: CurrencyId, defaultValue: object): Promise<object> {
    return await this.getValue(`currencySettings.${ id }`, defaultValue);
  }

  async setCurrencySettings(id: CurrencyId, value: object) {
    return await this.setValue(`currencySettings.${ id }`, value);
  }

  async accessWinWebcam(): Promise<boolean> {
    return this.getValue('accessWinWebcam', null);
  }

  async setAccessWinWebcam(value: boolean) {
    return this.setValue('accessWinWebcam', value);
  }

  private async getValue(path: string, defaultValue: any): Promise<any> {
    return get(this.settings, path, defaultValue);
  }

  private async setValue(path: string, value: any) {
    set(this.settings, path, value);
    return await this.fs.writeFile(this.settingsFileName, JSON.stringify(this.settings));
  }

  private async getSettings() {
    let settings = null;
    try {
      settings = JSON.parse(await this.fs.readFile(this.settingsFileName));
      if (!settings || typeof(settings) !== 'object') {
        throw new Error('Invalid settings');
      }
    } catch (e) {
      settings = {...this.defaultSettings};
    }
    return settings;
  }
}
