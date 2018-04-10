import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';
import {PincodeComponent} from "../screens/factors/pincode/pincode.component";
import {PasswordComponent} from "../screens/factors/password/password.component";
import {FileUploadComponent} from "../screens/factors/file-upload/file-upload.component";
import {GraphicKeyComponent} from "../screens/factors/graphic-key/graphic-key.component";
import {QrCodeComponent} from "../screens/factors/qr-code/qr-code.component";
import {NfcComponent} from "../screens/factors/nfc/nfc.component";

declare const CryptoCore: any;
declare const Buffer: any;
declare const nfc: any;

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

  stFactorError = 'Incorrect factor ';

  static async toId(name: string) {
    return (await CryptoCore.Utils.sha256(Buffer.from(name, 'utf-8'))).toString('hex');
  }

  constructor(private readonly notification: NotificationService) {
    this.available.push(new AvailableFactor(FactorType.PIN, AvailableFactorName.PIN, FactorIcon.PIN,
      FactorIconAsset.PIN, FactorLink.PIN, PincodeComponent));
    this.available.push(new AvailableFactor(FactorType.PASSWORD, AvailableFactorName.PASSWORD, FactorIcon.PASSWORD,
      FactorIconAsset.PASSWORD, FactorLink.PASSWORD, PasswordComponent));
    this.available.push(new AvailableFactor(FactorType.FILE, AvailableFactorName.FILE, FactorIcon.FILE,
      FactorIconAsset.FILE, FactorLink.FILE, FileUploadComponent));
    this.available.push(new AvailableFactor(FactorType.GRAPHIC_KEY, AvailableFactorName.GRAPHIC_KEY, FactorIcon.GRAPHIC_KEY,
      FactorIconAsset.GRAPHIC_KEY, FactorLink.GRAPHIC_KEY, GraphicKeyComponent));
    this.available.push(new AvailableFactor(FactorType.QR, AvailableFactorName.QR, FactorIcon.QR,
      FactorIconAsset.QR, FactorLink.QR, QrCodeComponent));
    this.authFactors.push(new AvailableFactor(FactorType.QR, AvailableFactorName.QR, FactorIcon.QR,
      FactorIconAsset.QR, FactorLink.QR, QrCodeComponent));

    nfc.enabled(function () {
        this.available.push(new AvailableFactor(FactorType.NFC, AvailableFactorName.NFC, FactorIcon.NFC,
          FactorIconAsset.NFC, FactorLink.NFC, NfcComponent));
        this.authFactors.push(new AvailableFactor(FactorType.NFC, AvailableFactorName.NFC, FactorIcon.NFC,
          FactorIconAsset.NFC, FactorLink.NFC, NfcComponent));
      }.bind(this), function (e) {
      if (e !== 'NO_NFC') {
        this.available.push(new AvailableFactor(FactorType.NFC, AvailableFactorName.NFC, FactorIcon.NFC,
          FactorIconAsset.NFC, FactorLink.NFC, NfcComponent));
        this.authFactors.push(new AvailableFactor(FactorType.NFC, AvailableFactorName.NFC, FactorIcon.NFC,
          FactorIconAsset.NFC, FactorLink.NFC, NfcComponent));
      }
    }.bind(this));
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
        return new Factor(FactorType.PIN, FactorName.PIN, FactorIcon.PIN, FactorIconAsset.PIN, value);
      }
      case FactorType.PASSWORD: {
        return new Factor(FactorType.PASSWORD, FactorName.PASSWORD, FactorIcon.PASSWORD, FactorIconAsset.PASSWORD, value);
      }
      case FactorType.FILE: {
        return new Factor(FactorType.FILE, FactorName.FILE, FactorIcon.FILE, FactorIconAsset.FILE, value);
      }
      case FactorType.GRAPHIC_KEY: {
        return new Factor(FactorType.GRAPHIC_KEY, FactorName.GRAPHIC_KEY, FactorIcon.GRAPHIC_KEY, FactorIconAsset.GRAPHIC_KEY, value);
      }
      case FactorType.QR: {
        return new Factor(FactorType.QR, FactorName.QR, FactorIcon.QR, FactorIconAsset.QR, value);
      }
      case FactorType.NFC: {
        return new Factor(FactorType.NFC, FactorName.NFC, FactorIcon.NFC, FactorIconAsset.NFC, value);
      }
    }
  }

  async tryDecryptWith(factor) {
    const currentData = this.remoteEncryptedTrees[this.remoteEncryptedTrees.length - 1];

    const matchResult = await CryptoCore.Utils.matchPassphrase(currentData, await factor.toBuffer());

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
    NFC
  }

  export enum AvailableFactorName {
    PIN = 'PIN',
    PASSWORD = 'Password',
    FILE = 'File',
    GRAPHIC_KEY = 'Graphic key',
    QR = 'QR',
    NFC = 'NFC'
  }

  export enum FactorName {
    PIN = 'PIN code',
    PASSWORD = 'password',
    FILE = 'file',
    GRAPHIC_KEY = 'graphic key',
    QR = 'QR code',
    NFC = 'NFC tag'
  }

  export enum FactorIcon {
    PIN = 'dialpad',
    PASSWORD = 'keyboard',
    FILE = 'insert_drive_file',
    GRAPHIC_KEY = '',
    QR = '',
    NFC = 'nfc'
  }

  export enum FactorIconAsset {
    PIN = '',
    PASSWORD = '',
    FILE = '',
    GRAPHIC_KEY = 'graphic-key',
    QR = 'qr-code',
    NFC = ''
  }

  export enum FactorLink {
    PIN = 'pincode',
    PASSWORD = 'password',
    FILE = 'file-upload',
    GRAPHIC_KEY = 'graphic-key',
    QR = 'qr-code',
    NFC = 'nfc'
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

    constructor(type, name, icon, asset, value) {
      this.type = type;
      this.name = name;
      this.icon = icon;
      this.icon_asset = asset;
      this.value = value;
      this.state = 'active';
    }

    public async toBuffer() {
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(this.type, 0);

      return await CryptoCore.Utils.sha256(Buffer.concat([prefix, this.value]));
    }
  }

