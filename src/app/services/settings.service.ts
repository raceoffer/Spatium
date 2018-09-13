import { Injectable } from '@angular/core';
import { FileService } from './file.service';

@Injectable()
export class SettingsService {
  private readonly settingsFileName = 'settings.json';
  private readonly defaultSettings = {
    presentationViewed: false,
    startPath: null,
    fingerprintEnabled: false,
    settingsCurrency: null,
  };

  private settings = {};

  constructor(private readonly fs: FileService) {
  }

  async initializeSettings()  {
    this.settings = await this.getSettings();
  }

  async presentationViewed(): Promise<boolean> {
    return this.getValue('presentationViewed');
  }

  async setPresentationViewed(value: boolean) {
    return this.setValue('presentationViewed', value);
  }

  async startPath(): Promise<string | null> {
    return this.getValue('startPath');
  }

  async setStartPath(value: string | null) {
    return this.setValue('startPath', value);
  }

  async fingerprintEnabled(): Promise<boolean> {
    return this.getValue('fingerprintEnabled');
  }

  async setFingerprintEnabled(value: boolean) {
    return this.setValue('fingerprintEnabled', value);
  }

  async settingsCurrency(): Promise<object | null> {
    return this.getValue('settingsCurrency');
  }

  async setSettingsCurrency(value: object | null) {
    return this.setValue('settingsCurrency', value);
  }

  private async getValue(key: string): Promise<any> {
    return this.settings[key];
  }

  private async setValue(key: string, value: any) {
    this.settings[key] = value;
    return await this.fs.writeFile(this.settingsFileName, JSON.stringify(this.settings));
  }

  private async getSettings() {
    let settings = null;
    try {
      settings = JSON.parse(await this.fs.readFile(this.settingsFileName));
      if (!settings || typeof(settings) !== 'object') { throw new Error('Invalid settings'); }
    } catch (e) {
      settings = {...this.defaultSettings};
    }
    return settings;
  }
}
