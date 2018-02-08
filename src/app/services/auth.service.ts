import {Injectable} from '@angular/core';
import {NotificationService} from './notification.service';

declare const Utils: any;
declare const Buffer: any;
declare const nfc: any;

@Injectable()
export class AuthService {
  login: string;
  password: string;
  qr: string;
  nfc: string;
  factors: Factor[] = [];
  available: AvailableFactor[] = [];

  encryptedSeed: string = null;

  ethereumSecret: any = null;
  encryptedTreeData: any = null;
  remoteEncryptedTrees: Array<any> = [];

  stFactorError = 'Incorrect factor ';

  static toId(name: string): string {
    return Utils.sha256(Buffer.from(name, 'utf-8')).toString('hex');
  }

  constructor(private readonly notification: NotificationService) {
    this.available.push(new AvailableFactor(FactorType.PIN, AvailableFactorName.PIN, FactorIcon.PIN,
      FactorIconAsset.PIN, FactorLink.PIN));
    this.available.push(new AvailableFactor(FactorType.PASSWORD, AvailableFactorName.PASSWORD, FactorIcon.PASSWORD,
      FactorIconAsset.PASSWORD, FactorLink.PASSWORD));
    this.available.push(new AvailableFactor(FactorType.FILE, AvailableFactorName.FILE, FactorIcon.FILE,
      FactorIconAsset.FILE, FactorLink.FILE));
    this.available.push(new AvailableFactor(FactorType.GRAPHIC_KEY, AvailableFactorName.GRAPHIC_KEY, FactorIcon.GRAPHIC_KEY,
      FactorIconAsset.GRAPHIC_KEY, FactorLink.GRAPHIC_KEY));
    this.available.push(new AvailableFactor(FactorType.QR, AvailableFactorName.QR, FactorIcon.QR,
      FactorIconAsset.QR, FactorLink.QR));

    nfc.enabled(function () {
        this.available.push(new AvailableFactor(FactorType.NFC, AvailableFactorName.NFC, FactorIcon.NFC,
          FactorIconAsset.NFC, FactorLink.NFC));
      }.bind(this), function (e) {
      if (e !== 'NO_NFC') {
        this.available.push(new AvailableFactor(FactorType.NFC, AvailableFactorName.NFC, FactorIcon.NFC,
          FactorIconAsset.NFC, FactorLink.NFC));
      }
    }.bind(this));
  }

  getAllAvailableFactors() {
    return this.available;
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

  addFactor(type, value) {
    this.factors.push(this.newFactor(type, value));
  }

  addAuthFactor(type, value) {
    let newFactor = this.newFactor(type, value);
    let random_boolean = Math.random() >= 0.5;

    if (random_boolean) {
      this.factors.push(newFactor);
    } else {
      this.notification.show(this.stFactorError + newFactor.name);
    }
  }

  rmFactor(factor) {
    this.factors.splice(this.factors.indexOf(factor), 1);
  }

  rmAuthFactor(factor) {
    this.factors = this.factors.slice(0, this.factors.indexOf(factor));
  }

  clearFactors() {
    this.factors = [];
  }
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

    constructor(type, name, icon, icon_asset, link) {
      this.type = type;
      this.name = name;
      this.icon = icon;
      this.icon_asset = icon_asset;
      this.link = link;
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

    public toBuffer() {
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(this.type, 0);

      return Utils.sha256(Buffer.concat([prefix, this.value]));
    }
  }

