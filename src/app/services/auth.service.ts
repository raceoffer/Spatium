import {Injectable} from '@angular/core';

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

  static toId(name: string): string {
    return Utils.sha256(Buffer.from(name, 'utf-8')).toString('hex');
  }

  constructor() {
    this.available.push(new AvailableFactor(FactorType.PIN, 'PIN', FactorIcon.PIN,
      FactorIconAsset.PIN, FactorLink.PIN));
    this.available.push(new AvailableFactor(FactorType.PASSWORD, 'Password', FactorIcon.PASSWORD,
      FactorIconAsset.PASSWORD, FactorLink.PASSWORD));
    this.available.push(new AvailableFactor(FactorType.FILE, 'File', FactorIcon.FILE,
      FactorIconAsset.FILE, FactorLink.FILE));
    this.available.push(new AvailableFactor(FactorType.GRAPHIC_KEY, 'Graphic key', FactorIcon.GRAPHIC_KEY,
      FactorIconAsset.GRAPHIC_KEY, FactorLink.GRAPHIC_KEY));
    this.available.push(new AvailableFactor(FactorType.QR, 'QR', FactorIcon.QR,
      FactorIconAsset.QR, FactorLink.QR));

    nfc.enabled(function () {
        this.available.push(new AvailableFactor(FactorType.NFC, 'NFC', FactorIcon.NFC,
          FactorIconAsset.NFC, FactorLink.NFC));
      }.bind(this), function (e) {
      if (e !== 'NO_NFC') {
        this.available.push(new AvailableFactor(FactorType.NFC, 'NFC', FactorIcon.NFC,
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
        return new Factor(FactorType.PIN, FactorIcon.PIN, FactorIconAsset.PIN, value);
      }
      case FactorType.PASSWORD: {
        return new Factor(FactorType.PASSWORD, FactorIcon.PASSWORD, FactorIconAsset.PASSWORD, value);
      }
      case FactorType.FILE: {
        return new Factor(FactorType.FILE, FactorIcon.FILE, FactorIconAsset.FILE, value);
      }
      case FactorType.GRAPHIC_KEY: {
        return new Factor(FactorType.GRAPHIC_KEY, FactorIcon.GRAPHIC_KEY, FactorIconAsset.GRAPHIC_KEY, value);
      }
      case FactorType.QR: {
        return new Factor(FactorType.QR, FactorIcon.QR, FactorIconAsset.QR, value);
      }
      case FactorType.NFC: {
        return new Factor(FactorType.NFC, FactorIcon.NFC, FactorIconAsset.NFC, value);
      }
    }
  }

  addFactor(type, value) {
    this.factors.push(this.newFactor(type, value));
  }

  rmFactor(factor) {
    this.factors.splice(this.factors.indexOf(factor), 1);
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
    name: string;
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
    icon: string;
    icon_asset: string;
    value: any;

    constructor(type, icon, asset, value) {
      this.type = type;
      this.icon = icon;
      this.icon_asset = asset;
      this.value = value;
    }

    public toBuffer() {
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(this.type, 0);

      return Utils.sha256(Buffer.concat([prefix, this.value]));
    }
  }

