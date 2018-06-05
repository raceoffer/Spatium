import { Injectable } from '@angular/core';
import { DeviceService } from './device.service';

declare const nfc: any;
declare const device: any;

import { sha256, matchPassphrase } from 'crypto-core-async/lib/utils';
import { NotificationService } from "./notification.service";
import { WorkerService } from "./worker.service";

@Injectable()
export class AuthService {
  login: string;
  password: string;
  loginType: LoginType;
  isPasswordFirst: boolean;

  factors: Factor[] = [];
  available: AvailableFactor[] = [];
  authFactors: AvailableFactor[] = [];

  decryptedSeed: any = null;

  encryptedSeed: string = null;

  remoteEncryptedTrees: Array<Array<any>> = [];

  currentTree: any = null;

  stFactorError = 'Incorrect factor ';

  constructor(
    private readonly deviceService: DeviceService,
    private readonly notification: NotificationService,
    private readonly workerService: WorkerService
  ) {
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();
  }

  public async toId(name: string) {
    return await sha256(Buffer.from(name, 'utf-8'), this.workerService.worker);
  }

  getAllAvailableFactors() {
    return this.available;
  }

  getAuthFactors() {
    return this.authFactors;
  }

  newFactor(type, value) {
    switch (type) {
      case FactorType.PIN: {
        return new Factor(FactorType.PIN, FactorName.PIN, FactorIcon.PIN, FactorIconAsset.PIN, value, this.workerService.worker);
      }
      case FactorType.PASSWORD: {
        return new Factor(FactorType.PASSWORD, FactorName.PASSWORD, FactorIcon.PASSWORD, FactorIconAsset.PASSWORD, value, this.workerService.worker);
      }
      /*case FactorType.FILE: {
        return new Factor(FactorType.FILE, FactorName.FILE, FactorIcon.FILE, FactorIconAsset.FILE, value, this.workerService.worker);
      }*/
      case FactorType.GRAPHIC_KEY: {
        return new Factor(FactorType.GRAPHIC_KEY, FactorName.GRAPHIC_KEY, FactorIcon.GRAPHIC_KEY, FactorIconAsset.GRAPHIC_KEY, value, this.workerService.worker);
      }
      case FactorType.QR: {
        return new Factor(FactorType.QR, FactorName.QR, FactorIcon.QR, FactorIconAsset.QR, value, this.workerService.worker);
      }
      case FactorType.NFC: {
        return new Factor(FactorType.NFC, FactorName.NFC, FactorIcon.NFC, FactorIconAsset.NFC, value, this.workerService.worker);
      }
      case FactorType.LOGIN: {
        return new Factor(FactorType.LOGIN, FactorName.LOGIN, FactorIcon.LOGIN, FactorIconAsset.LOGIN, value, this.workerService.worker);
      }
    }
  }

  async tryDecryptWith(factor) {
    const currentData = this.remoteEncryptedTrees[this.remoteEncryptedTrees.length - 1];

    const matchResult = await matchPassphrase(currentData, await factor.toBuffer(), this.workerService.worker);

    if (typeof matchResult.seed !== 'undefined') {
      this.decryptedSeed = matchResult.seed;
      return true;
    }

    if (matchResult.subtexts.length < 1) {
      return false;
    }

    this.remoteEncryptedTrees.push(matchResult.subtexts);

    return true;
  }

  async addFactor(type, value) {
    this.factors.push(this.newFactor(type, value));
  }

  async addAuthFactor(type, value) {
    const newFactor = this.newFactor(type, value);

    const success = await this.tryDecryptWith(newFactor);

    if (success) {
      this.factors.push(newFactor);
      if (this.factors.length === 1 && this.loginType === LoginType.LOGIN) {
        this.isPasswordFirst = true;
      }
    } else {
      this.notification.show(this.stFactorError + newFactor.name);
    }

    return this.isPasswordFirst;
  }

  rmFactor(factor) {
    this.factors.splice(this.factors.indexOf(factor), 1);
  }

  rmFactorWithChildren(factor) {
    const index = this.factors.indexOf(factor);

    this.factors = this.factors.slice(0, index);
  }

  rmAuthFactor(factor) {
    const index = this.factors.indexOf(factor);

    this.factors = this.factors.slice(0, index);
    this.remoteEncryptedTrees = this.remoteEncryptedTrees.slice(0, index + 1);
    if (this.decryptedSeed) {
      this.decryptedSeed.fill(0);
      this.decryptedSeed = null;
    }

    if (this.factors.length === 0 && this.loginType === LoginType.LOGIN) {
      this.isPasswordFirst = false;
    }

    return this.isPasswordFirst;
  }

  clearFactors() {
    this.factors = [];
  }

  reset() {
    if (this.decryptedSeed) {
      this.decryptedSeed.fill(0);
      this.decryptedSeed = null;
    }

    this.remoteEncryptedTrees = [];
  }

  makeNewLogin(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  makeNewPIN(length: number) {
    let text = '';
    const possible = '0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }
}

export enum LoginType {
  LOGIN = 0,
  QR = 1,
  NFC = 2
}

export enum FactorType {
  PIN,
  PASSWORD,
  FILE,
  GRAPHIC_KEY,
  QR,
  NFC,
  LOGIN
}

export enum AvailableFactorName {
  PIN = 'PIN',
  PASSWORD = 'Password',
  FILE = 'File',
  GRAPHIC_KEY = 'Graphic key',
  QR = 'QR',
  NFC = 'NFC',
  LOGIN = 'Login',
}

export enum FactorName {
  PIN = 'PIN code',
  PASSWORD = 'password',
  FILE = 'file',
  GRAPHIC_KEY = 'graphic key',
  QR = 'QR code',
  NFC = 'NFC tag',
  LOGIN = 'login',
}

export enum FactorIcon {
  PIN = 'dialpad',
  PASSWORD = 'keyboard',
  FILE = 'insert_drive_file',
  GRAPHIC_KEY = '',
  QR = '',
  NFC = 'nfc',
  LOGIN = 'text_fields'
}

export enum FactorIconAsset {
  PIN = '',
  PASSWORD = '',
  FILE = '',
  GRAPHIC_KEY = 'icon-custom-graphic_key',
  QR = 'icon-custom-qr_code',
  NFC = '',
  LOGIN = ''
}

export enum FactorLink {
  PIN = 'pincode',
  PASSWORD = 'password',
  FILE = 'file-upload',
  GRAPHIC_KEY = 'graphic-key',
  QR = 'qr-code',
  NFC = 'nfc',
  LOGIN = 'login-factor'
}

export class AvailableFactor {
  type: FactorType;
  name: AvailableFactorName;
  icon: string;
  icon_asset: string;
  link: string;
  component: any;

  constructor(type, name, icon, icon_asset, link, component) {
    this.type = type;
    this.name = name;
    this.icon = icon;
    this.icon_asset = icon_asset;
    this.link = link;
    this.component = component;
  }
}

export class Factor {
  type: FactorType;
  name: FactorName;
  icon: string;
  icon_asset: string;
  value: any;
  state: string;
  worker: any;

  constructor(type, name, icon, asset, value, worker) {
    this.type = type;
    this.name = name;
    this.icon = icon;
    this.icon_asset = asset;
    this.value = value;
    this.state = 'active';
    this.worker = worker;
  }

  public async toBuffer() {
    const prefix = Buffer.alloc(4);
    prefix.writeUInt32BE(this.type, 0);

    return await sha256(Buffer.concat([prefix, this.value]), this.worker);
  }
}
