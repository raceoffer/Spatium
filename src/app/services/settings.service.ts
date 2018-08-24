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

  constructor(private readonly fs: FileService) {
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
    let settings = await this.getSettings();
    return settings[key];
  }

  private async setValue(key: string, value: any) {
    let settings = await this.getSettings();
    settings[key] = value;
    return this.fs.writeFile(this.settingsFileName, JSON.stringify(settings));
  }

  private async getSettings() {
    let settings = null;
    try {
      settings = JSON.parse(await this.fs.readFile(this.settingsFileName));
      if (!settings || typeof(settings) !== 'object') throw new Error('Invalid settings');
    } catch (e) {
      settings = {...this.defaultSettings};
    }
    return settings;
  }
}
